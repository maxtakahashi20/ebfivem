import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { IdentidadeMilitarDigital } from "@/components/military/IdentidadeMilitarDigital";
import { consultarIdentidade } from "@/lib/inscricoes.functions";

type Inscricao = NonNullable<Awaited<ReturnType<typeof consultarIdentidade>>>;

type Props = {
  onOpenDocumentos?: () => void;
};

const inputClass =
  "w-full bg-transparent border border-(--color-input) px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-(--color-olive-deep)";

/** Carteira militar digital: consulta por protocolo + RG, sem login. */
export function PerfilMilitar({ onOpenDocumentos }: Props) {
  const consultar = useServerFn(consultarIdentidade);
  const [protocolo, setProtocolo] = useState("");
  const [rg, setRg] = useState("");
  const [loading, setLoading] = useState(false);
  const [inscricao, setInscricao] = useState<Inscricao | null>(null);
  const [semRegistro, setSemRegistro] = useState(false);

  // Memo: a carteira reemite (som + toast) sempre que `dados` muda de referência.
  const dados = useMemo(
    () =>
      inscricao && {
        protocolo: inscricao.protocolo,
        nome: inscricao.nome,
        sobrenome: inscricao.sobrenome,
        rg: inscricao.rg,
        created_at: inscricao.created_at,
      },
    [inscricao],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = protocolo.trim().toUpperCase();
    if (!/^EB-[0-9A-F]{8}$/.test(p)) {
      toast.error("Protocolo inválido. Use o formato EB-XXXXXXXX.");
      return;
    }
    if (!/^\d{1,8}$/.test(rg)) {
      toast.error("Informe um RG numérico de 1 a 8 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const row = await consultar({ data: { protocolo: p, rg } });
      setInscricao(row);
      setSemRegistro(!row);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao consultar a identidade.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="stencil text-xs text-(--color-olive-deep)">IDENTIDADE MILITAR DIGITAL</p>
        <p className="text-sm text-(--color-stencil)">
          Informe o protocolo e o RG da ficha de alistamento para abrir a carteira.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="field-paper p-5 flex flex-col sm:flex-row gap-3 sm:items-end"
      >
        <div className="flex-1 w-full">
          <label htmlFor="identidade-protocolo" className="block stencil text-[11px] mb-1">
            Protocolo
          </label>
          <input
            id="identidade-protocolo"
            type="text"
            value={protocolo}
            onChange={(e) => setProtocolo(e.target.value.toUpperCase().slice(0, 11))}
            className={inputClass}
            placeholder="EB-XXXXXXXX"
            required
          />
        </div>
        <div className="flex-1 w-full">
          <label htmlFor="identidade-rg" className="block stencil text-[11px] mb-1">
            RG
          </label>
          <input
            id="identidade-rg"
            type="text"
            inputMode="numeric"
            value={rg}
            onChange={(e) => setRg(e.target.value.replace(/\D/g, "").slice(0, 8))}
            className={inputClass}
            placeholder="Até 8 dígitos"
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-olive shrink-0 disabled:opacity-60">
          {loading ? "CONSULTANDO…" : "▸ ABRIR CARTEIRA"}
        </button>
      </form>

      {semRegistro && (
        <div className="field-paper p-6 text-center reveal">
          <div className="stamp text-(--color-destructive) mb-3">SEM REGISTRO</div>
          <p>Nenhuma ficha localizada com este protocolo e RG.</p>
        </div>
      )}

      {inscricao && dados && (
        <div className="space-y-4">
          <div className="stencil text-xs">
            FICHA · {inscricao.protocolo} ·{" "}
            <span className="uppercase">{inscricao.status.replace("_", " ")}</span>
          </div>
          <IdentidadeMilitarDigital aprovado={inscricao.status === "aprovado"} dados={dados} />
          {inscricao.status === "aprovado" && onOpenDocumentos && (
            <p className="text-center pt-4">
              <button type="button" className="btn-ghost-olive text-xs" onClick={onOpenDocumentos}>
                ▸ GERAR DOCUMENTOS MILITARES (PDF)
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
