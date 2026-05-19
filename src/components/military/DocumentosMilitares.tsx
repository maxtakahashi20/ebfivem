import { useState } from "react";
import { toast } from "sonner";
import {
  baixarDocumentoMilitar,
  type TipoDocumentoMilitar,
} from "@/lib/documentos-militares-pdf";
import { montarIdentidade } from "@/lib/militar-identidade";
import { playScanner, playConfirm } from "@/lib/military-sounds";

const TIPOS: { id: TipoDocumentoMilitar; label: string; hint: string }[] = [
  { id: "certificado", label: "Certificado", hint: "Condecoração de mérito operacional" },
  { id: "ficha", label: "Ficha militar", hint: "Registro individual de efetivo" },
  { id: "ordem", label: "Ordem de serviço", hint: "Diretriz operacional do Comando" },
  { id: "boletim", label: "Boletim interno", hint: "Publicação oficial da unidade" },
];

type Props = {
  militarDefault?: {
    nome: string;
    sobrenome: string;
    rg: string;
    protocolo: string;
    created_at?: string;
  };
};

export function DocumentosMilitares({ militarDefault }: Props) {
  const [tipo, setTipo] = useState<TipoDocumentoMilitar>("certificado");
  const [titulo, setTitulo] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [referencia, setReferencia] = useState("");
  const [corpo, setCorpo] = useState("");
  const [autoridade, setAutoridade] = useState("COMANDO MILITAR DO FIVEM");
  const [nomeMilitar, setNomeMilitar] = useState(
    militarDefault ? `${militarDefault.nome} ${militarDefault.sobrenome}`.trim() : "",
  );
  const [rg, setRg] = useState(militarDefault?.rg ?? "");
  const [protocolo] = useState(militarDefault?.protocolo ?? "");
  const [vincularId, setVincularId] = useState(Boolean(militarDefault?.protocolo));

  const gerar = () => {
    if (!corpo.trim()) {
      toast.error("Informe o texto principal do documento.");
      return;
    }
    playScanner();
    const identidade =
      vincularId && protocolo && rg
        ? montarIdentidade({
            protocolo,
            nome: militarDefault?.nome ?? nomeMilitar.split(" ")[0] ?? "",
            sobrenome:
              militarDefault?.sobrenome ?? nomeMilitar.split(" ").slice(1).join(" ") ?? "",
            rg,
            created_at: militarDefault?.created_at,
          })
        : undefined;

    baixarDocumentoMilitar({
      tipo,
      titulo: titulo.trim() || undefined,
      destinatario: destinatario.trim() || undefined,
      referencia: referencia.trim() || undefined,
      corpo: corpo.trim(),
      autoridade: autoridade.trim() || undefined,
      militar: nomeMilitar.trim()
        ? {
            nome: nomeMilitar.trim(),
            rg: rg || undefined,
            matricula: identidade?.matricula,
            patente: identidade?.patente,
          }
        : undefined,
      identidade,
    });
    playConfirm();
    toast.success("Documento gerado (PDF).");
  };

  const cfg = TIPOS.find((t) => t.id === tipo)!;

  return (
    <div className="space-y-6" data-sfx-off>
      <div className="grid sm:grid-cols-2 gap-2">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTipo(t.id)}
            className={`field-paper p-4 text-left border-2 transition-colors ${
              tipo === t.id
                ? "border-(--color-olive-deep) bg-(--color-khaki)/50"
                : "border-transparent hover:border-(--color-border)"
            }`}
          >
            <div className="font-display tracking-widest text-sm">{t.label}</div>
            <p className="text-xs text-(--color-stencil) mt-1">{t.hint}</p>
          </button>
        ))}
      </div>

      <form
        className="field-paper p-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          gerar();
        }}
      >
        <p className="stencil text-xs text-(--color-olive-deep)">
          GERAR {cfg.label.toUpperCase()} · PDF
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block stencil text-[10px] mb-1">Título (opcional)</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full border border-(--color-input) bg-transparent px-3 py-2 text-sm font-mono"
              placeholder={cfg.label}
            />
          </div>
          <div>
            <label className="block stencil text-[10px] mb-1">Referência</label>
            <input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              className="w-full border border-(--color-input) bg-transparent px-3 py-2 text-sm font-mono"
              placeholder="OS-2026-001"
            />
          </div>
        </div>

        <div>
          <label className="block stencil text-[10px] mb-1">Destinatário / unidade</label>
          <input
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
            className="w-full border border-(--color-input) bg-transparent px-3 py-2 text-sm"
            placeholder="1ª Companhia · Pelotão Alfa"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 border-t border-dashed border-(--color-border) pt-4">
          <div>
            <label className="block stencil text-[10px] mb-1">Militar (nome completo)</label>
            <input
              value={nomeMilitar}
              onChange={(e) => setNomeMilitar(e.target.value)}
              className="w-full border border-(--color-input) bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block stencil text-[10px] mb-1">RG</label>
            <input
              value={rg}
              onChange={(e) => setRg(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="w-full border border-(--color-input) bg-transparent px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>

        {protocolo && (
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={vincularId}
              onChange={(e) => setVincularId(e.target.checked)}
              className="accent-(--color-olive-deep)"
            />
            <span>Vincular identidade digital (matrícula e validade no PDF)</span>
          </label>
        )}

        <div>
          <label className="block stencil text-[10px] mb-1">Texto do documento</label>
          <textarea
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            rows={8}
            required
            className="w-full border border-(--color-input) bg-transparent px-3 py-2 text-sm font-mono leading-relaxed resize-y min-h-[140px]"
            placeholder={
              tipo === "ordem"
                ? "1. O efetivo apresentará-se às 20h00 no QG virtual.\n2. Uniforme: operações noturnas."
                : "Corpo do certificado, ficha ou boletim…"
            }
          />
        </div>

        <div>
          <label className="block stencil text-[10px] mb-1">Autoridade emissora</label>
          <input
            value={autoridade}
            onChange={(e) => setAutoridade(e.target.value)}
            className="w-full border border-(--color-input) bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <button type="submit" className="btn-olive">
          ▸ Gerar PDF
        </button>
      </form>
    </div>
  );
}
