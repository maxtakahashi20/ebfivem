import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { criarInscricao } from "@/lib/inscricoes.functions";
import { baixarComprovante } from "@/lib/inscricao-pdf";

export const Route = createFileRoute("/inscricao")({
  head: () => ({
    meta: [
      { title: "Alistamento · CMF" },
      { name: "description", content: "Ficha oficial de alistamento do CMF — Comando Militar do Fivem." },
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
      const res = await submit({ data: form });
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
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="field-paper p-10 text-center relative reveal">
          <div className="absolute -top-3 left-6 tag-rank">FICHA DEFERIDA</div>
          <div className="stamp text-(--color-olive-deep) mb-6 mt-4">RECEBIDO</div>
          <h1 className="text-3xl mb-2">Apresentação registrada</h1>
          <p className="text-(--color-stencil) mb-6">
            Sua ficha foi encaminhada ao instrutor de plantão. Guarde seu protocolo e seu comprovante em PDF.
          </p>
          <div className="font-mono text-2xl bg-(--color-olive-deep) text-(--color-olive-bright) py-4 px-6 inline-block tracking-widest">
            {done.protocolo}
          </div>
          <p className="text-xs text-(--color-stencil) mt-3">
            O comprovante foi baixado automaticamente. Caso não tenha baixado, clique abaixo.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={baixarNovamente} className="btn-olive">▸ Baixar Comprovante (PDF)</button>
            <Link to="/acompanhar" search={{ rg: done.rg, protocolo: done.protocolo }} className="btn-ghost-olive">Acompanhar Status</Link>
            <Link to="/" className="btn-ghost-olive">Informativo</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="stencil text-xs mb-2">FORMULÁRIO 02-B · FICHA DE ALISTAMENTO CMF</div>
      <h1 className="text-4xl mb-2">Apresente-se</h1>
      <p className="text-(--color-stencil) mb-8 max-w-xl">
        Toda informação será analisada por um instrutor designado do CMF. Ao final do envio, você
        receberá automaticamente um <strong>comprovante oficial em PDF</strong> com seu código
        de identificação.
      </p>

      <form onSubmit={onSubmit} className="field-paper p-8 space-y-5 relative">
        <div className="absolute -top-3 left-6 tag-rank">RESTRITO · CONSCRITO</div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Nome" value={form.nome} onChange={(v) => set("nome", v)} required maxLength={80} />
          <Field label="Sobrenome" value={form.sobrenome} onChange={(v) => set("sobrenome", v)} required maxLength={80} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field
            label="RG (até 8 dígitos)"
            value={form.rg}
            onChange={(v) => set("rg", v)}
            required
            inputMode="numeric"
          />
          <Field
            label="TELEFONE IN GAME"
            value={form.telefone}
            onChange={(v) => set("telefone", v)}
            required
            maxLength={20}
            highlight
          />
        </div>
        <Field
          label="ID do Discord"
          value={form.discord_id}
          onChange={(v) => set("discord_id", v)}
          required
          placeholder="usuario#0000 ou ID numérico"
          maxLength={64}
        />
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-(--color-border)">
          <div className="stencil text-[10px]">DECLARO QUE AS INFORMAÇÕES SÃO VERDADEIRAS.</div>
          <button type="submit" disabled={loading} className="btn-olive disabled:opacity-60">
            {loading ? "ENVIANDO…" : "▸ ENVIAR FICHA"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field(props: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string; maxLength?: number;
  inputMode?: "text" | "numeric"; highlight?: boolean;
}) {
  return (
    <div>
      <label
        className={
          "block stencil text-[11px] mb-1 " +
          (props.highlight
            ? "text-(--color-olive-deep) font-bold tracking-[0.22em] bg-gold/40 px-2 py-1 inline-block border-l-2 border-(--color-olive-deep)"
            : "")
        }
      >
        {props.label}
      </label>
      <input
        type="text"
        className="w-full bg-transparent border border-(--color-input) px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-(--color-olive-bright)"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        placeholder={props.placeholder}
        maxLength={props.maxLength}
        inputMode={props.inputMode}
      />
    </div>
  );
}
