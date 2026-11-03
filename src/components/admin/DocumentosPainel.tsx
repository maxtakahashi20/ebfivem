import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { DocumentosMilitares } from "@/components/military/DocumentosMilitares";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useDiscordSession } from "@/hooks/useDiscordSession";
import { buscarInscricaoPorDiscord } from "@/lib/discord-auth.functions";
import { consultarPorProtocolo } from "@/lib/inscricoes.functions";
import { consumePendingDocProtocolo } from "@/lib/painel-nav";

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
  const { session } = useDiscordSession();
  const buscarDiscord = useServerFn(buscarInscricaoPorDiscord);
  const consultarProt = useServerFn(consultarPorProtocolo);
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
      const pendingProto = consumePendingDocProtocolo();

      if (pendingProto) {
        const p = normalizeProtocolo(pendingProto) || pendingProto;
        if (/^EB-[0-9A-F]{8}$/.test(p)) {
          const r = await consultarProt({ data: { protocolo: p } });
          const row = (r as Inscricao[])[0];
          if (!cancelled && row?.status === "aprovado") {
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
  }, [session, buscarDiscord, consultarProt]);

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
