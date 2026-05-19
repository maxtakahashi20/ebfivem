import type { DiscordRoleTag } from "@/lib/discord-oauth";
import { ordenarCargosDiscord, PATENTE_CARGO_INDEX } from "@/lib/militar-identidade";

export function DiscordRoleTags({ roles }: { roles: DiscordRoleTag[] }) {
  if (!roles.length) {
    return (
      <p className="text-[10px] text-(--color-stencil) stencil">SEM CARGOS NO SERVIDOR</p>
    );
  }

  const ordenados = ordenarCargosDiscord(roles);

  return (
    <div className="flex flex-wrap gap-1.5">
      {ordenados.map((r, i) => (
        <span
          key={r.id}
          className={`discord-role-tag${i === PATENTE_CARGO_INDEX ? " discord-role-tag--patente" : ""}`}
          style={
            r.color
              ? {
                  borderColor: r.color,
                  color: r.color,
                  backgroundColor: `${r.color}18`,
                }
              : undefined
          }
          title={i === PATENTE_CARGO_INDEX ? `${r.name} · patente/graduação` : r.name}
        >
          {r.name}
        </span>
      ))}
    </div>
  );
}
