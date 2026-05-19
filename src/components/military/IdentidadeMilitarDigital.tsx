import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  montarIdentidade,
  gerarQrDataUrl,
  carregarFotoLocal,
  salvarFotoLocal,
  type IdentidadeGerada,
  type IdentidadeMilitarData,
} from "@/lib/militar-identidade";
import { baixarCarteiraMilitar } from "@/lib/documentos-militares-pdf";
import { playScanner, playConfirm } from "@/lib/military-sounds";
import type { DiscordProfile } from "@/lib/discord-oauth";
import { CarteiraMilitarVisual } from "@/components/military/CarteiraMilitarVisual";

type Props = {
  dados: IdentidadeMilitarData;
  /** Só exibe emissão completa se aprovado */
  aprovado?: boolean;
  /** Perfil Discord — nome, avatar e tags na carteira */
  discordProfile?: DiscordProfile | null;
};

export function IdentidadeMilitarDigital({ dados, aprovado = true, discordProfile }: Props) {
  const [id, setId] = useState<IdentidadeGerada | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const emitir = useCallback(async () => {
    if (!aprovado) {
      toast.error("Identidade disponível apenas para inscrições aprovadas.");
      return;
    }
    playScanner();
    const gerada = montarIdentidade(dados);
    const fotoSalva = carregarFotoLocal(gerada.matricula);
    if (fotoSalva) gerada.fotoDataUrl = fotoSalva;
    else if (foto) gerada.fotoDataUrl = foto;
    else if (discordProfile?.avatarUrl) gerada.fotoDataUrl = discordProfile.avatarUrl;
    setId(gerada);
    const qr = await gerarQrDataUrl(gerada.qrPayload, 140);
    setQrUrl(qr);
    playConfirm();
    toast.success("Identidade militar gerada.");
  }, [dados, aprovado, foto, discordProfile]);

  useEffect(() => {
    if (aprovado) void emitir();
  }, [aprovado, emitir]);

  const onFoto = (file: File | null) => {
    if (!file || !id) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setFoto(url);
      salvarFotoLocal(id.matricula, url);
      setId({ ...id, fotoDataUrl: url });
    };
    reader.readAsDataURL(file);
  };

  const baixarCarteira = async () => {
    if (!id || !qrUrl) return;
    playScanner();
    await baixarCarteiraMilitar(id, qrUrl, { discordProfile: discordProfile ?? undefined });
    toast.success("Carteira militar baixada (PDF).");
  };

  if (!aprovado) {
    return (
      <div className="field-paper p-6 border border-(--color-border)">
        <p className="stencil text-xs text-(--color-stencil)">IDENTIDADE MILITAR DIGITAL</p>
        <p className="text-sm mt-2 text-(--color-stencil)">
          Disponível após aprovação do alistamento pelo Comando.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-sfx-off>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="stencil text-xs text-(--color-olive-deep)">IDENTIDADE OFICIAL · ALISTAMENTO</p>
          <p className="text-sm text-(--color-stencil)">
            Carteira com protocolo, RG e QR Code da ficha aprovada.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost-olive text-xs" onClick={() => void emitir()}>
            ↻ Regenerar
          </button>
          <button
            type="button"
            className="btn-olive text-xs"
            disabled={!id || !qrUrl}
            onClick={() => void baixarCarteira()}
          >
            ▸ Baixar carteira (PDF)
          </button>
        </div>
      </div>

      {id && qrUrl && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <CarteiraMilitarVisual
            id={id}
            qrUrl={qrUrl}
            discordProfile={discordProfile}
            onUpload={() => fileRef.current?.click()}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFoto(e.target.files?.[0] ?? null)}
          />
          <div className="text-xs font-mono text-(--color-stencil) space-y-2 max-w-xs">
            <p>
              <span className="stencil">MATRÍCULA:</span> {id.matricula}
            </p>
            <p>
              <span className="stencil">VALIDADE:</span> {id.validadeDe} → {id.validadeAte}
            </p>
            <p className="opacity-80">
              O QR Code valida os dados no ambiente fictício CMF/FiveM. Adicione sua foto oficial
              (3×4) para personalizar a carteira.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
