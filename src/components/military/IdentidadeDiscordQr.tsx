import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { DiscordProfile } from "@/lib/discord-oauth";
import {
  gerarQrDataUrl,
  montarIdentidadeDiscord,
  type IdentidadeGerada,
} from "@/lib/militar-identidade";
import { CarteiraMilitarVisual } from "@/components/military/CarteiraMilitarVisual";
import { playConfirm, playScanner } from "@/lib/military-sounds";

type Props = {
  profile: DiscordProfile;
};

export function IdentidadeDiscordQr({ profile }: Props) {
  const [id, setId] = useState<IdentidadeGerada | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  const emitir = useCallback(async () => {
    setGerando(true);
    try {
      playScanner();
      const gerada = montarIdentidadeDiscord(profile);
      const qr = await gerarQrDataUrl(gerada.qrPayload, 140);
      setId(gerada);
      setQrUrl(qr);
      playConfirm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar QR Code.");
    } finally {
      setGerando(false);
    }
  }, [profile]);

  useEffect(() => {
    void emitir();
  }, [emitir]);

  const baixar = async () => {
    if (!id || !qrUrl) return;
    playScanner();
    await baixarCarteiraMilitar(id, qrUrl, {
      discordProfile: profile,
      footerLeft: `DISCORD ${profile.id}`,
    });
    toast.success("Carteira militar baixada (PDF).");
  };

  return (
    <div className="space-y-4" data-sfx-off>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="stencil text-xs text-(--color-olive-deep)">CREDENCIAL DIGITAL · QR CODE</p>
          <p className="text-sm text-(--color-stencil)">
            Gerada automaticamente ao autenticar no Discord. Valida nome, matrícula e cargos no
            servidor CMF.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost-olive text-xs"
            disabled={gerando}
            onClick={() => void emitir()}
          >
            ↻ Regenerar QR
          </button>
        </div>
      </div>

      {gerando && !qrUrl && (
        <p className="stencil text-xs text-(--color-stencil) animate-pulse">GERANDO QR CODE…</p>
      )}

      {id && qrUrl && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <CarteiraMilitarVisual
            id={id}
            qrUrl={qrUrl}
            discordProfile={profile}
            footerLeft={`DISCORD ${profile.id}`}
          />
          <div className="text-xs font-mono text-(--color-stencil) space-y-2 max-w-xs">
            <p>
              <span className="stencil">MATRÍCULA:</span> {id.matricula}
            </p>
            <p>
              <span className="stencil">VALIDADE:</span> {id.validadeDe} → {id.validadeAte}
            </p>
            <p className="opacity-80">
              Escaneie o QR para validar a credencial no ambiente fictício CMF/FiveM. Após aprovação
              do alistamento, a identidade oficial com protocolo substitui esta credencial.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
