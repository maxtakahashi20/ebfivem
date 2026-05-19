/** Tipos e helpers compartilhados — OAuth Discord + cargos do servidor CMF */

export type DiscordRoleTag = {
  id: string;
  name: string;
  /** Cor em #RRGGBB ou vazio se sem cor */
  color: string;
  position: number;
};

export type DiscordProfile = {
  id: string;
  username: string;
  globalName: string | null;
  displayName: string;
  avatarUrl: string;
  nick: string | null;
  roles: DiscordRoleTag[];
  /** Aviso quando cargos não puderam ser carregados (bot/servidor). */
  rolesWarning?: string;
};

export const DISCORD_SESSION_KEY = "cmf_discord_session";
export const DISCORD_OAUTH_STATE_KEY = "cmf_discord_oauth_state";

export function discordAvatarUrl(userId: string, avatar: string | null, size = 128): string {
  if (avatar) {
    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=${size}`;
  }
  const index = Number((BigInt(userId) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

export function roleColorHex(color: number): string {
  if (!color) return "";
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function discordConfig() {
  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
  const redirectUri = process.env.DISCORD_REDIRECT_URI?.trim();
  return { clientId, clientSecret, guildId, botToken, redirectUri };
}

export function assertDiscordOAuthConfigured() {
  const { clientId, clientSecret, guildId } = discordConfig();
  if (!clientId || !clientSecret || !guildId) {
    throw new Error(
      "Discord OAuth não configurado. Defina DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET e DISCORD_GUILD_ID no .env.",
    );
  }
  return { clientId: clientId!, clientSecret: clientSecret!, guildId: guildId! };
}
