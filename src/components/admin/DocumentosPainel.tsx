import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { DocumentosMilitares } from "@/components/military/DocumentosMilitares";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { buscarInscricaoPorDiscord } from "@/lib/discord-auth.functions";
import { buscarFichaParaDocumento } from "@/lib/inscricoes.functions";
import { getDiscordSessionToken } from "@/lib/painel-auth-storage";
import { limparPendingDocProtocolo, pendingDocProtocolo } from "@/lib/painel-nav";

type Inscricao = {
  protocolo: string;
  nome: string;
  sobrenome: string;
  rg: string;
  status: string;
  created_at: string;
};

function normalizeProtocolo(raw: string): string {
  let s = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!s.startsWith("EB")) return "";
  s = s.slice(2).replace(/^-+/, "");
  if (!/^[0-9A-F]{8}$/.test(s)) return "";
  return `EB-${s}`;
}

export function DocumentosPainel() {
  const buscarDiscord = useServerFn(buscarInscricaoPorDiscord);
  const buscarFicha = useServerFn(buscarFichaParaDocumento);
  const [militar, setMilitar] = useState<{
    nome: string;
    sobrenome: string;
    rg: string;
    protocolo: string;
    created_at?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const session = getDiscordSessionToken();
      const pendingProto = pendingDocProtocolo();

      if (pendingProto) {
        const p = normalizeProtocolo(pendingProto) || pendingProto;
        if (/^EB-[0-9A-F]{8}$/.test(p)) {
          // Quem não é instrutor cai na própria ficha, logo abaixo.
          const row = (await buscarFicha({ data: { session, protocolo: p } }).catch(
            () => null,
          )) as Inscricao | null;
          if (cancelled) return;
          limparPendingDocProtocolo();
          if (row?.status === "aprovado") {
            setMilitar({
              nome: row.nome,
              sobrenome: row.sobrenome,
              rg: row.rg,
              protocolo: row.protocolo,
              created_at: row.created_at,
            });
            setLoading(false);
            return;
          }
        }
      }

      if (session) {
        try {
          const r = await buscarDiscord({ data: { session } });
          const ins = r.inscricao as Inscricao | null;
          if (!cancelled && ins?.status === "aprovado") {
            setMilitar({
              nome: ins.nome,
              sobrenome: ins.sobrenome,
              rg: ins.rg,
              protocolo: ins.protocolo,
              created_at: ins.created_at,
            });
          } else if (!cancelled) {
            setMilitar(null);
          }
        } catch {
          if (!cancelled) setMilitar(null);
        }
      } else if (!cancelled) {
        setMilitar(null);
      }

      if (!cancelled) setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [buscarDiscord, buscarFicha]);

  return (
    <div>
      <AdminPageHeader
        tag="PAINEL MEMBRO"
        title="Documentos Militares"
        sub="Certificados, fichas, ordens de serviço e boletins — exportação em PDF."
      />

      {loading && (
        <div className="field-paper p-6 text-center stencil text-xs">CARREGANDO…</div>
      )}

      {!loading && !militar && (
        <div className="field-paper p-5 mb-6 text-sm text-(--color-stencil)">
          <p>
            Vincule sua inscrição aprovada no Discord (menu <strong>Identidade</strong>) ou informe
            os dados manualmente abaixo para gerar PDFs.
          </p>
        </div>
      )}

      {!loading && <DocumentosMilitares militarDefault={militar ?? undefined} />}
    </div>
  );
}
