import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Check } from "lucide-react";
import { Turnstile } from "@/components/Turnstile";
import { FieldLabel, PageHero, btnPrimary, inputClass } from "@/components/site-ui";
import { criarInscricao } from "@/lib/inscricoes.functions";
import { baixarComprovante } from "@/lib/inscricao-pdf";

export const Route = createFileRoute("/inscricao")({
  head: () => ({
    meta: [
      { title: "Alistamento · 2ª DE" },
      { name: "description", content: "Ficha oficial de alistamento da 2ª DE — 2ª Divisão do Exército." },
    ],
  }),
  component: Inscricao,
});

type Form = {
  nome: string; sobrenome: string; rg: string;
  telefone: string; discord_id: string;
};

function Inscricao() {
  const submit = useServerFn(criarInscricao);
  const hidratado = useHydrated();
  const [turnstileToken, setTurnstileToken] = useState<string>();
  const [turnstileVersao, setTurnstileVersao] = useState(0);
  const [form, setForm] = useState<Form>({
    nome: "", sobrenome: "", rg: "", telefone: "", discord_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ protocolo: string; rg: string; created_at?: string } | null>(null);

  function set<K extends keyof Form>(k: K, v: string) {
    if (k === "rg") v = v.replace(/\D/g, "").slice(0, 8);
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{1,8}$/.test(form.rg)) {
      toast.error("RG deve conter até 8 dígitos numéricos.");
      return;
    }
    setLoading(true);
    try {
      const res = await submit({ data: { ...form, turnstileToken } });
      setDone({ protocolo: res.protocolo, rg: res.rg, created_at: res.created_at });
      toast.success(`Inscrição registrada · Protocolo ${res.protocolo}`);
      // Gera e baixa automaticamente o comprovante em PDF.
      try {
        baixarComprovante({
          protocolo: res.protocolo,
          nome: form.nome,
          sobrenome: form.sobrenome,
          rg: form.rg,
          telefone: form.telefone,
          discord_id: form.discord_id,
          created_at: res.created_at,
        });
      } catch (pdfErr) {
        console.error("PDF gen error", pdfErr);
      }
    } catch (err) {
      setTurnstileVersao((v) => v + 1);
      toast.error(err instanceof Error ? err.message : "Falha ao registrar inscrição.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    const baixarNovamente = () =>
      baixarComprovante({
        protocolo: done.protocolo,
        nome: form.nome,
        sobrenome: form.sobrenome,
        rg: form.rg,
        telefone: form.telefone,
        discord_id: form.discord_id,
        created_at: done.created_at,
      });

    return (
      <div className="bg-bone text-ink">
        <div className="mx-auto max-w-2xl px-4 sm:px-10 py-20 md:py-28">
          <div className="bg-paper border border-ink/20 p-8 sm:p-12 text-center flex flex-col items-center gap-5 reveal">
            <div className="font-mono text-xs tracking-[0.2em] text-(--color-olive)">FICHA DEFERIDA</div>
            <div className="stamp text-ink">RECEBIDO</div>
            <h1 className="font-display text-4xl font-semibold">Apresentação registrada</h1>
            <p className="text-mute max-w-md">
              Sua ficha foi encaminhada ao instrutor de plantão. Guarde seu protocolo e seu comprovante em PDF.
            </p>
            <div className="font-mono text-2xl sm:text-3xl tracking-[0.2em] bg-ink text-field px-6 py-4">
              {done.protocolo}
            </div>
            <p className="text-sm text-mute">
              O comprovante foi baixado automaticamente. Caso não tenha baixado, clique abaixo.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              <button onClick={baixarNovamente} className={btnPrimary}>BAIXAR COMPROVANTE (PDF)</button>
              <Link
                to="/acompanhar"
                search={{ rg: done.rg, protocolo: done.protocolo }}
                className="inline-flex items-center px-7 py-4 border border-ink/40 font-display tracking-[0.12em] hover:bg-ink hover:text-bone transition"
              >
                ACOMPANHAR STATUS
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bone text-ink">
      <PageHero
        eyebrow="FORMULÁRIO 02-B · FICHA DE ALISTAMENTO"
        title="Apresente-se."
        sub="Preencha sua ficha em 2 minutos. Um instrutor designado analisa cada candidatura e você recebe na hora um comprovante oficial em PDF."
        img="/galeria/123156.webp"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-10 py-20 md:py-24 flex flex-col lg:flex-row gap-12 lg:gap-20">
        <ol className="lg:w-95 shrink-0">
          <li className="font-mono text-xs tracking-[0.2em] text-(--color-olive)">COMO FUNCIONA</li>
          {etapas.map(([t, d], i) => (
            <li key={t} className="flex gap-5 py-6 border-b border-ink/20">
              <span className={`font-display text-[28px] ${i === 0 ? "text-field" : "text-mute/40"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-1.5">
                <span className="font-display text-[21px] font-medium">{t}</span>
                <span className="text-[15px] text-mute">{d}</span>
              </div>
            </li>
          ))}
        </ol>

        <form onSubmit={onSubmit} className="flex-1 flex flex-col gap-6 bg-paper border border-ink/20 p-6 sm:p-12">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-ink/20">
            <h2 className="font-display text-[28px] font-medium">Ficha do conscrito</h2>
            <span className="bg-ink px-2.5 py-1.5 font-mono text-[11px] tracking-widest text-sand">RESTRITO · CONSCRITO</span>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="NOME *" placeholder="Seu nome no jogo" value={form.nome} onChange={(v) => set("nome", v)} required maxLength={80} />
            <Field label="SOBRENOME *" placeholder="Seu sobrenome no jogo" value={form.sobrenome} onChange={(v) => set("sobrenome", v)} required maxLength={80} />
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="RG *" placeholder="Até 8 dígitos" value={form.rg} onChange={(v) => set("rg", v)} required inputMode="numeric" />
            <Field label="TELEFONE IN GAME *" placeholder="000-0000" value={form.telefone} onChange={(v) => set("telefone", v)} required maxLength={20} />
          </div>
          <Field
            label="ID DO DISCORD *"
            value={form.discord_id}
            onChange={(v) => set("discord_id", v)}
            required
            placeholder="usuario ou ID numérico"
            maxLength={64}
            hint="Usado para te chamar quando a ficha for analisada."
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" required className="peer sr-only" />
            <span className="h-5 w-5 shrink-0 border border-ink/40 bg-white flex items-center justify-center peer-checked:bg-field peer-checked:border-field peer-focus-visible:ring-2 peer-focus-visible:ring-field [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
              <Check className="h-3.5 w-3.5 text-night" />
            </span>
            <span className="text-[15px]">Declaro que as informações são verdadeiras.</span>
          </label>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <Turnstile key={turnstileVersao} onToken={setTurnstileToken} />
            <button type="submit" disabled={loading || !hidratado} className={btnPrimary}>
              {loading ? "ENVIANDO…" : "ENVIAR FICHA"} <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const etapas = [
  ["Preencha a ficha", "Seus dados de jogo e o ID do Discord."],
  ["Receba o protocolo", "Comprovante em PDF baixado na hora."],
  ["Análise do instrutor", "Um instrutor designado avalia a ficha."],
  ["Apresente-se", "Aprovado, você é chamado ao posto."],
];

function Field(props: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string; maxLength?: number;
  inputMode?: "text" | "numeric"; hint?: string;
}) {
  return (
    <label className="block">
      <FieldLabel>{props.label}</FieldLabel>
      <input
        type="text"
        className={inputClass}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        placeholder={props.placeholder}
        maxLength={props.maxLength}
        inputMode={props.inputMode}
      />
      {props.hint && <span className="block mt-2 text-[13px] text-mute">{props.hint}</span>}
    </label>
  );
}
