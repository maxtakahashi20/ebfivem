import type { IdentidadeGerada } from "@/lib/militar-identidade";
import type { DiscordProfile } from "@/lib/discord-oauth";
import { DiscordRoleTags } from "@/components/military/DiscordRoleTags";

type Props = {
  id: IdentidadeGerada;
  qrUrl: string;
  discordProfile?: DiscordProfile | null;
  onUpload?: () => void;
  footerLeft?: string;
};

export function CarteiraMilitarVisual({
  id,
  qrUrl,
  discordProfile,
  onUpload,
  footerLeft,
}: Props) {
  const nome =
    discordProfile?.displayName?.toUpperCase() ?? `${id.nome} ${id.sobrenome}`.toUpperCase();

  return (
    <div className="id-militar-card relative w-full max-w-md select-none">
      <div className="id-militar-holo" aria-hidden />
      <div className="id-militar-inner">
        <div className="id-militar-header">
          <span className="text-[8px] tracking-[0.2em] opacity-90">REPÚBLICA · CMF · FIVEM</span>
          <span className="text-[9px] font-display tracking-widest">IDENTIDADE MILITAR</span>
        </div>
        <div className="id-militar-body">
          {onUpload ? (
            <button
              type="button"
              onClick={onUpload}
              className="id-militar-photo group relative shrink-0"
              title="Enviar foto"
            >
              {id.fotoDataUrl ? (
                <img src={id.fotoDataUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-[9px] stencil text-(--color-stencil)">FOTO</span>
              )}
              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white">
                ALTERAR
              </span>
            </button>
          ) : (
            <div className="id-militar-photo relative shrink-0">
              {id.fotoDataUrl ? (
                <img src={id.fotoDataUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-[9px] stencil text-(--color-stencil)">FOTO</span>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-1 font-mono text-[10px]">
            <div>
              <div className="stencil text-[7px] opacity-70">NOME</div>
              <div className="font-bold text-xs truncate">{nome}</div>
            </div>
            <div>
              <div className="stencil text-[7px] opacity-70">MATRÍCULA</div>
              <div className="font-bold text-sm tracking-wider text-(--color-olive-deep)">
                {id.matricula}
              </div>
            </div>
            <div className="flex gap-4">
              <div>
                <div className="stencil text-[7px] opacity-70">PATENTE / CARGO</div>
                <div className="truncate max-w-[140px]">{id.patente}</div>
              </div>
              <div>
                <div className="stencil text-[7px] opacity-70">RG / ID</div>
                <div>{id.rg}</div>
              </div>
            </div>
            <div>
              <div className="stencil text-[7px] opacity-70">VALIDADE</div>
              <div>
                {id.validadeDe} — {id.validadeAte}
              </div>
            </div>
            {discordProfile && discordProfile.roles.length > 0 && (
              <div className="pt-1">
                <div className="stencil text-[7px] opacity-70 mb-0.5">CARGOS</div>
                <DiscordRoleTags roles={discordProfile.roles} />
              </div>
            )}
          </div>
          <img
            src={qrUrl}
            alt="QR Code identidade CMF"
            className="size-[72px] shrink-0 border border-(--color-olive-deep)/40"
          />
        </div>
        <div className="id-militar-footer font-mono text-[7px] opacity-80 flex justify-between gap-2">
          <span className="truncate">{footerLeft ?? `PROTOCOLO ${id.protocolo}`}</span>
          <span className="shrink-0">DOC. FICTÍCIO · CMF</span>
        </div>
      </div>
    </div>
  );
}
