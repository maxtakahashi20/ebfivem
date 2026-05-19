import type { DiscordProfile } from "@/lib/discord-oauth";
import { DiscordRoleTags } from "@/components/military/DiscordRoleTags";

export function DiscordProfileCard({ profile }: { profile: DiscordProfile }) {
  return (
    <div className="field-paper p-5 flex flex-col sm:flex-row gap-4 items-start">
      <img
        src={profile.avatarUrl}
        alt=""
        className="size-20 rounded-full border-2 border-(--color-olive-deep) shrink-0"
      />
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="stencil text-[10px] text-(--color-stencil)">DISCORD · CMF</p>
          <p className="font-display text-xl tracking-wide text-(--color-olive-deep)">
            {profile.displayName}
          </p>
          <p className="text-xs font-mono text-(--color-stencil)">@{profile.username}</p>
        </div>
        <div>
          <p className="stencil text-[9px] mb-1 opacity-80">CARGOS (TAGS)</p>
          <DiscordRoleTags roles={profile.roles} />
          {profile.rolesWarning && (
            <p className="text-[10px] text-amber-900 mt-2 font-mono leading-snug">
              {profile.rolesWarning}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
