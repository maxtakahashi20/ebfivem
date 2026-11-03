import { createHash, timingSafeEqual } from "node:crypto";

const sha256 = (s: string) => createHash("sha256").update(s).digest();

/** Valida a chave única do painel. Sem ACCESS_KEY no servidor, ninguém entra. */
export function assertAccessKey(key: string): void {
  const expected = process.env.ACCESS_KEY?.trim();
  if (!expected) throw new Error("ACCESS_KEY não configurada no servidor.");
  if (!timingSafeEqual(sha256(key.trim()), sha256(expected))) {
    throw new Error("Chave de acesso inválida");
  }
}
