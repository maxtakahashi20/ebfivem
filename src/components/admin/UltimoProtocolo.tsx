import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { obterUltimoProtocolo } from "@/lib/inscricoes.functions";

const POLL_MS = 10_000;

/** `navigator.clipboard` só existe em HTTPS/localhost; em http:// usa o caminho antigo. */
async function copiar(texto: string): Promise<boolean> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      /* cai no caminho antigo */
    }
  }
  const area = document.createElement("textarea");
  area.value = texto;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  return ok;
}

/** Protocolo da inscrição mais recente, no header do painel (`#panel-header-slot`). */
export function UltimoProtocolo({ accessKey }: { accessKey: string }) {
  const buscar = useServerFn(obterUltimoProtocolo);
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const carregar = () =>
      buscar({ data: { accessKey } })
        .then(setProtocolo)
        .catch(() => {});
    void carregar();
    const id = setInterval(carregar, POLL_MS);
    return () => clearInterval(id);
  }, [accessKey, buscar]);

  useEffect(() => {
    if (!copiado) return;
    const id = setTimeout(() => setCopiado(false), 1500);
    return () => clearTimeout(id);
  }, [copiado]);

  const slot = document.getElementById("panel-header-slot");
  if (!slot) return null;

  return createPortal(
    protocolo ? (
      <button
        type="button"
        title="Copiar o protocolo da inscrição mais recente"
        aria-label={`Copiar protocolo ${protocolo}`}
        className="flex items-center gap-2 border border-(--color-olive-deep) px-3 py-1.5 font-mono text-sm text-(--color-olive-deep) hover:bg-olive-deep/10"
        onClick={async () => {
          if (await copiar(protocolo)) setCopiado(true);
          else toast.error("Não foi possível copiar o protocolo.");
        }}
      >
        <span className="stencil text-[9px] hidden sm:inline">ÚLTIMO PROTOCOLO</span>
        {protocolo}
        {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
        <span className="sr-only" aria-live="polite">
          {copiado ? "Copiado" : ""}
        </span>
      </button>
    ) : (
      <span className="stencil text-[9px] text-(--color-stencil)">SEM INSCRIÇÕES</span>
    ),
    slot,
  );
}
