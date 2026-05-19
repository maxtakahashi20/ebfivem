import type { DiscordProfile } from "@/lib/discord-oauth";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SessionPayload = DiscordProfile & { exp: number };

function sessionSecret(): string {
  return (
    process.env.DISCORD_SESSION_SECRET?.trim() ||
    process.env.ACCESS_KEY?.trim() ||
    "cmf-discord-dev-secret"
  );
}

/** Base64url com suporte a UTF-8 (nicks/cargos com emoji e acentos). */
function encodeBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmacSign(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const bytes = new Uint8Array(sig);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function signDiscordSession(profile: DiscordProfile): Promise<string> {
  const payload: SessionPayload = { ...profile, exp: Date.now() + SESSION_TTL_MS };
  const body = encodeBase64Url(JSON.stringify(payload));
  const sig = await hmacSign(body);
  return `${body}.${sig}`;
}

export async function verifyDiscordSession(token: string): Promise<DiscordProfile | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await hmacSign(body);
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const json = JSON.parse(decodeBase64Url(body)) as SessionPayload;
    if (!json.exp || json.exp < Date.now()) return null;
    const { exp: _exp, ...profile } = json;
    return profile;
  } catch {
    return null;
  }
}
