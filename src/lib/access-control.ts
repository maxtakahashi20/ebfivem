import type { DiscordProfile, DiscordRoleTag } from "@/lib/discord-oauth";

function parseRoleIds(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/** IDs de cargo Alto Comando — `DISCORD_ALTO_COMANDO_ROLE_IDS=id1,id2,...` */
function altoComandoRoleIds(): Set<string> {
  return parseRoleIds(process.env.DISCORD_ALTO_COMANDO_ROLE_IDS);
}

/** IDs de cargo Desenvolvedor — `DISCORD_DESENVOLVEDOR_ROLE_IDS=id1,id2,...` */
function desenvolvedorRoleIds(): Set<string> {
  return parseRoleIds(process.env.DISCORD_DESENVOLVEDOR_ROLE_IDS);
}

function profileHasAnyRole(
  profile: Pick<DiscordProfile, "roles"> | null | undefined,
  ids: Set<string>,
): boolean {
  if (!profile?.roles?.length || ids.size === 0) return false;
  return profile.roles.some((r: DiscordRoleTag) => ids.has(r.id));
}

/** Cargos de Alto Comando configurados via env. */
export function isAltoComando(
  profile: Pick<DiscordProfile, "roles"> | null | undefined,
): boolean {
  return profileHasAnyRole(profile, altoComandoRoleIds());
}

/** Cargos de Desenvolvedor configurados via env (acesso pleno ao painel). */
export function isDesenvolvedor(
  profile: Pick<DiscordProfile, "roles"> | null | undefined,
): boolean {
  return profileHasAnyRole(profile, desenvolvedorRoleIds());
}

/** Desenvolvedor ou Alto Comando — libera todas as áreas restritas do painel. */
export function hasFullAccess(
  profile: Pick<DiscordProfile, "roles"> | null | undefined,
): boolean {
  return isDesenvolvedor(profile) || isAltoComando(profile);
}

export type Papel = "membro" | "instrutor" | "alto-comando";

const NIVEL: Record<Papel, number> = { membro: 0, instrutor: 1, "alto-comando": 2 };

export function papelAlcanca(papel: Papel, exigido: Papel): boolean {
  return NIVEL[papel] >= NIVEL[exigido];
}

/** `DISCORD_INSTRUTOR_ROLE_IDS=id1,id2,...`; vazio = só o Alto Comando atua no recrutamento. */
export function papelDoPerfil(profile: Pick<DiscordProfile, "roles"> | null | undefined): Papel {
  if (hasFullAccess(profile)) return "alto-comando";
  return profileHasAnyRole(profile, parseRoleIds(process.env.DISCORD_INSTRUTOR_ROLE_IDS))
    ? "instrutor"
    : "membro";
}

/** Igual a `hasFullAccess`, porém lança erro padronizado quando o gate falha (uso em server fns). */
export function assertFullAccess(
  profile: Pick<DiscordProfile, "roles"> | null | undefined,
): void {
  if (!hasFullAccess(profile)) {
    throw new Error("Acesso restrito ao Alto Comando.");
  }
}
