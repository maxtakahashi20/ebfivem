import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { consultarPorProtocolo, consultarPorRg } from "@/lib/inscricoes.functions";
import { IdentidadeMilitarDigital } from "@/components/military/IdentidadeMilitarDigital";
import { Link } from "@tanstack/react-router";
import { useDiscordSession } from "@/hooks/useDiscordSession";
import { goToPainel } from "@/lib/painel-nav";

const searchSchema = z.object({
  rg: z.string().optional(),
  protocolo: z.string().optional(),
});

export const Route = createFileRoute("/acompanhar")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Acompanhar Inscrição · Exército Brasileiro" },
      {
        name: "description",
        content: "Acompanhe o status do seu alistamento pelo RG ou pelo protocolo da ficha.",
      },
    ],
  }),
  component: Acompanhar,
});

type Inscricao = {
  protocolo: string; nome: string; sobrenome: string; rg: string;
  status: "pendente" | "em_analise" | "aprovado" | "reprovado";
  observacoes_instrutor: string | null;
  created_at: string; updated_at: string;
};

const STATUS_LABEL: Record<Inscricao["status"], { txt: string; color: string }> = {
  pendente:    { txt: "Pendente · Aguardando análise",     color: "oklch(0.72 0.13 80)" },
  em_analise:  { txt: "Em análise pelo instrutor",         color: "oklch(0.55 0.12 230)" },
  aprovado:    { txt: "Aprovado · Apresente-se ao posto",  color: "oklch(0.50 0.13 145)" },
  reprovado:   { txt: "Reprovado · Veja observações",      color: "oklch(0.48 0.18 30)" },
};

/** Aceita EB-XXXXXXXX ou EBXXXXXXXX (hex 8 caracteres). */
function normalizeProtocolo(raw: string): string {
  let s = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!s.startsWith("EB")) return "";
  s = s.slice(2).replace(/^-+/, "");
  if (!/^[0-9A-F]{8}$/.test(s)) return "";
  return `EB-${s}`;
}

function Acompanhar() {
  const { rg: initialRg, protocolo: initialProtocolo } = Route.useSearch();
  const consultarRg = useServerFn(consultarPorRg);
  const consultarProt = useServerFn(consultarPorProtocolo);
  const [rg, setRg] = useState(initialRg ?? "");
  const [protocolo, setProtocolo] = useState(initialProtocolo ?? "");
  const [rows, setRows] = useState<Inscricao[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function searchByRg(value: string) {
    if (!/^\d{1,8}$/.test(value)) return;
    setLoading(true);
    try {
      const r = await consultarRg({ data: { rg: value } });
      setRows(r as Inscricao[]);
    } finally {
      setLoading(false);
    }
  }

  async function searchByProtocolo(raw: string) {
    const p = normalizeProtocolo(raw);
    if (!/^EB-[0-9A-F]{8}$/.test(p)) return;
    setLoading(true);
    try {
      const r = await consultarProt({ data: { protocolo: p } });
      setRows(r as Inscricao[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialProtocolo) void searchByProtocolo(initialProtocolo);
    else if (initialRg) void searchByRg(initialRg);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="stencil text-xs mb-2">PAINEL DO CONSCRITO</div>
      <h1 className="text-4xl mb-2">Acompanhar Alistamento</h1>
      <p className="text-(--color-stencil) mb-8">
        Informe seu RG ou o protocolo recebido ao enviar a ficha (ex.: EB-A1B2C3D4).
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmedProto = protocolo.trim();
          if (trimmedProto) {
            const pNorm = normalizeProtocolo(trimmedProto);
            if (!pNorm) {
              toast.error("Protocolo inválido. Use EB- seguido de 8 caracteres (ex.: EB-A1B2C3D4).");
              return;
            }
            void searchByProtocolo(trimmedProto);
            return;
          }
          if (!/^\d{1,8}$/.test(rg)) {
            toast.error("Informe um RG numérico de 1 a 8 dígitos ou um protocolo válido.");
            return;
          }
          void searchByRg(rg);
        }}
        className="field-paper p-5 flex flex-col gap-4"
      >
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block stencil text-[11px] mb-1">RG</label>
            <input
              type="text"
              inputMode="numeric"
              value={rg}
              onChange={(e) => setRg(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="w-full bg-transparent border border-(--color-input) px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-(--color-olive-deep)"
              placeholder="Até 8 dígitos"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-olive shrink-0">
            {loading ? "CONSULTANDO…" : "▸ CONSULTAR"}
          </button>
        </div>
        <div>
          <label className="block stencil text-[11px] mb-1">Ou protocolo</label>
          <input
            type="text"
            value={protocolo}
            onChange={(e) => setProtocolo(e.target.value.toUpperCase().replace(/[^EB0-9A-F-]/gi, "").slice(0, 11))}
            className="w-full bg-transparent border border-(--color-input) px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-(--color-olive-deep)"
            placeholder="EB-XXXXXXXX"
          />
          <p className="text-[10px] stencil text-(--color-stencil) mt-1">
            Se preencher o protocolo, a busca usa o protocolo e ignora o RG neste envio.
          </p>
        </div>
      </form>

      <div className="mt-8 space-y-4">
        {rows === null && (
          <div className="text-center text-(--color-stencil) py-8 stencil text-xs">
            AGUARDANDO CONSULTA
          </div>
        )}
        {rows && rows.length === 0 && (
          <div className="field-paper p-6 text-center reveal">
            <div className="stamp text-(--color-destructive) mb-3">SEM REGISTRO</div>
            <p>Nenhuma ficha localizada para este RG ou protocolo.</p>
          </div>
        )}
        {rows && rows.map((r, i) => {
          const s = STATUS_LABEL[r.status];
          return (
            <div key={r.protocolo} className="field-paper p-6 relative reveal" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="stencil text-[11px]">PROTOCOLO</div>
                  <div className="font-mono text-lg">{r.protocolo}</div>
                </div>
                <div className="px-3 py-1 font-display tracking-widest text-xs text-white" style={{ background: s.color }}>
                  {s.txt}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div><span className="stencil text-[10px]">CONSCRITO: </span>{r.nome} {r.sobrenome}</div>
                <div><span className="stencil text-[10px]">RG: </span>{r.rg}</div>
                <div><span className="stencil text-[10px]">APRESENTAÇÃO: </span>{new Date(r.created_at).toLocaleString("pt-BR")}</div>
                <div><span className="stencil text-[10px]">ATUALIZAÇÃO: </span>{new Date(r.updated_at).toLocaleString("pt-BR")}</div>
              </div>
              {r.observacoes_instrutor && (
                <div className="mt-4 p-3 border border-dashed border-(--color-olive-deep)">
                  <div className="stencil text-[10px] mb-1">OBSERVAÇÕES DO INSTRUTOR</div>
                  <p className="text-sm">{r.observacoes_instrutor}</p>
                </div>
              )}
              {r.status === "aprovado" && (
                <div className="mt-6 pt-6 border-t border-(--color-border)">
                  <IdentidadeMilitarDigital
                    aprovado
                    discordProfile={discordProfile}
                    dados={{
                      protocolo: r.protocolo,
                      nome: r.nome,
                      sobrenome: r.sobrenome,
                      rg: r.rg,
                      created_at: r.created_at,
                    }}
                  />
                  <p className="mt-4 text-center text-xs">
                    <button
                      type="button"
                      className="underline text-(--color-olive-deep) font-mono"
                      onClick={() => goToPainel("documentos", { protocolo: r.protocolo })}
                    >
                      Gerar documentos militares no painel (PDF) →
                    </button>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
