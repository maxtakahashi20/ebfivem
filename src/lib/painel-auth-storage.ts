import { DISCORD_SESSION_KEY } from "@/lib/discord-oauth";

/** Token assinado da sessão Discord: é a credencial de todas as funções do painel. */
export function getDiscordSessionToken(): string {
  return typeof window === "undefined" ? "" : (localStorage.getItem(DISCORD_SESSION_KEY) ?? "");
}

/** Só erro de sessão desloga; erro de configuração ou de validação precisa aparecer. */
export function isDiscordSessionInvalidError(message: string): boolean {
  return /sess[aã]o discord/i.test(message);
}
