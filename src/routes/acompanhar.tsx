import { createFileRoute, useHydrated } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { FieldLabel, PageHero, btnPrimary, inputClass } from "@/components/site-ui";
import { EASE, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { z } from "zod";
import { consultarFicha } from "@/lib/inscricoes.functions";
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
      { title: "Acompanhar Inscrição · 2ª DE" },
      {
        name: "description",
        content: "Acompanhe o status do seu alistamento com o protocolo e o RG da ficha.",
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

const STATUS_LABEL: Record<Inscricao["status"], { txt: string; color: string; etapa: number }> = {
  pendente:    { txt: "Pendente · Aguardando análise",     color: "#d4a94a", etapa: 0 },
  em_analise:  { txt: "Em análise pelo instrutor",         color: "#5b8fc4", etapa: 1 },
  aprovado:    { txt: "Aprovado · Apresente-se ao posto",  color: "#5e9a55", etapa: 3 },
  reprovado:   { txt: "Reprovado · Veja observações",      color: "#c0583a", etapa: 2 },
};

const ETAPAS = [
  ["Ficha recebida", "Protocolo gerado"],
  ["Em análise", "Instrutor avaliando"],
  ["Resultado", "Aprovado ou reprovado"],
  ["Apresentação", "Compareça ao posto"],
];

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
  const { profile: discordProfile } = useDiscordSession();
  const consultar = useServerFn(consultarFicha);
  const hidratado = useHydrated();
  const [rg, setRg] = useState(initialRg ?? "");
  const [protocolo, setProtocolo] = useState(initialProtocolo ?? "");
  const [rows, setRows] = useState<Inscricao[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function buscar(rawProtocolo: string, rgValor: string) {
    setLoading(true);
    try {
      const r = await consultar({
        data: { protocolo: normalizeProtocolo(rawProtocolo), rg: rgValor },
      });
      setRows(r as Inscricao[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na consulta.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialProtocolo && normalizeProtocolo(initialProtocolo) && /^\d{1,8}$/.test(initialRg ?? "")) {
      void buscar(initialProtocolo, initialRg ?? "");
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <div className="bg-bone text-ink">
      <PageHero
        eyebrow="PAINEL DO CONSCRITO"
        title="Acompanhe sua ficha."
        sub="Informe o protocolo do comprovante (ex.: EB-A1B2C3D4) e o RG da ficha para ver em que etapa está o seu alistamento."
        img="/galeria/12.webp"
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-10 py-20 md:py-24 flex flex-col gap-12">
        <Reveal>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!normalizeProtocolo(protocolo)) {
              toast.error("Protocolo inválido. Use EB- seguido de 8 caracteres (ex.: EB-A1B2C3D4).");
              return;
            }
            if (!/^\d{1,8}$/.test(rg)) {
              toast.error("Informe um RG numérico de 1 a 8 dígitos.");
              return;
            }
            void buscar(protocolo, rg);
          }}
          className="flex flex-col md:flex-row md:items-end gap-4 bg-paper border border-ink/20 p-6 sm:p-8"
        >
          <label className="flex-1">
            <FieldLabel>PROTOCOLO</FieldLabel>
            <input
              type="text"
              value={protocolo}
              onChange={(e) => setProtocolo(e.target.value.toUpperCase().replace(/[^EB0-9A-F-]/gi, "").slice(0, 11))}
              className={`${inputClass} font-mono`}
              placeholder="EB-XXXXXXXX"
            />
          </label>
          <label className="md:w-70">
            <FieldLabel>RG</FieldLabel>
            <input
              type="text"
              inputMode="numeric"
              value={rg}
              onChange={(e) => setRg(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className={inputClass}
              placeholder="Até 8 dígitos"
            />
          </label>
          <button type="submit" disabled={loading || !hidratado} className={btnPrimary}>
            {loading ? "CONSULTANDO…" : "CONSULTAR"} <Search className="h-4.5 w-4.5" />
          </button>
        </form>
        </Reveal>

        <div className="flex flex-col gap-6">
          {rows === null && (
            <motion.div
              className="py-6 text-center font-mono text-xs tracking-[0.2em] text-mute"
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              AGUARDANDO CONSULTA
            </motion.div>
          )}
          {rows && rows.length === 0 && (
            <motion.div
              className="bg-paper border border-ink/20 p-8 text-center"
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: [0, -14, 12, -8, 6, 0] }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="stamp text-(--color-destructive) mb-3"
                initial={{ scale: 2.5, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: -6, opacity: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.15 }}
              >
                SEM REGISTRO
              </motion.div>
              <p>Nenhuma ficha localizada com este protocolo e RG.</p>
            </motion.div>
          )}
          {rows && rows.map((r, i) => {
            const s = STATUS_LABEL[r.status];
            return (
              <motion.div
                key={r.protocolo}
                className="bg-ink text-bone"
                initial={{ opacity: 0, y: 50, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 sm:px-9 py-7 border-b border-sand/15">
                  <div className="flex flex-col gap-1.5">
                    <div className="font-mono text-[11px] tracking-[0.15em] text-sand/60">PROTOCOLO</div>
                    <div className="font-mono text-2xl sm:text-3xl tracking-[0.15em] text-field">{r.protocolo}</div>
                  </div>
                  <motion.div
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 border font-mono text-xs tracking-widest uppercase"
                    style={{ borderColor: s.color, background: `${s.color}26`, color: s.color }}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.35 }}
                  >
                    <motion.span
                      className="h-2 w-2 rounded-full"
                      style={{ background: s.color }}
                      animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                    {s.txt}
                  </motion.div>
                </div>
                <ol className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 sm:px-9 py-8">
                  {ETAPAS.map(([t, d], idx) => {
                    const feito = idx < s.etapa;
                    const atual = idx === s.etapa;
                    return (
                      <li key={t} className="flex flex-col gap-3">
                        {/* Barra da etapa enche da esquerda, uma depois da outra */}
                        <span className="h-1 w-full bg-[#d9d2b526]">
                          {(feito || atual) && (
                            <motion.span
                              className="block h-full origin-left"
                              style={{ background: atual ? s.color : "var(--color-field)" }}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.5, delay: 0.5 + idx * 0.3, ease: EASE }}
                            />
                          )}
                        </span>
                        <span className={`font-display text-xl ${feito || atual ? "text-bone" : "text-sand/50"}`}>{t}</span>
                        <span className="text-sm text-sand/60">{d}</span>
                      </li>
                    );
                  })}
                </ol>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 sm:px-9 pb-8">
                  {[
                    ["CONSCRITO", `${r.nome} ${r.sobrenome}`],
                    ["RG", r.rg],
                    ["APRESENTAÇÃO", new Date(r.created_at).toLocaleString("pt-BR")],
                    ["ATUALIZAÇÃO", new Date(r.updated_at).toLocaleString("pt-BR")],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-1.5">
                      <dt className="font-mono text-[11px] tracking-[0.15em] text-sand/60">{k}</dt>
                      <dd className="text-[17px]">{v}</dd>
                    </div>
                  ))}
                </dl>
                {r.observacoes_instrutor && (
                  <div className="mx-6 sm:mx-9 mb-8 p-4 border border-dashed border-sand/30">
                    <div className="font-mono text-[11px] tracking-[0.15em] text-brass mb-1.5">OBSERVAÇÕES DO INSTRUTOR</div>
                    <p className="text-sand">{r.observacoes_instrutor}</p>
                  </div>
                )}
                {r.status === "aprovado" && (
                  <div className="bg-bone text-ink p-6 sm:p-9">
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
                        className="underline text-ink font-mono"
                        onClick={() => goToPainel("documentos", { protocolo: r.protocolo, rg: r.rg })}
                      >
                        Gerar documentos militares no painel (PDF) →
                      </button>
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <Stagger as="ul" className="flex flex-wrap gap-x-6 gap-y-3">
          {Object.values(STATUS_LABEL).map((s) => (
            <StaggerItem as="li" key={s.txt} className="flex items-center gap-2.5 text-sm text-mute">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              {s.txt}
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  );
}
