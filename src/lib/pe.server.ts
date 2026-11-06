import { papelAlcanca, type Papel } from "@/lib/access-control";
import type { DiscordProfile } from "@/lib/discord-oauth";

function temCargo(profile: Pick<DiscordProfile, "roles">, raw: string | undefined): boolean {
  const ids = new Set(
    (raw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  return profile.roles.some((r) => ids.has(r.id));
}

/**
 * Polícia do Exército, por cargo do Discord:
 * `DISCORD_PE_ROLE_IDS` (patrulheiro) e `DISCORD_PE_COMANDO_ROLE_IDS` (comando da PE).
 * Alto Comando e acima também comandam a PE.
 */
export function acessoPE(
  profile: Pick<DiscordProfile, "roles">,
  papel: Papel,
): { pe: boolean; comando: boolean } {
  const comando =
    temCargo(profile, process.env.DISCORD_PE_COMANDO_ROLE_IDS) ||
    papelAlcanca(papel, "alto-comando");
  return { comando, pe: comando || temCargo(profile, process.env.DISCORD_PE_ROLE_IDS) };
}
