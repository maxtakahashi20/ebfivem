import type { Papel } from "@/lib/access-control";
import { papelAlcanca } from "@/lib/access-control";
import { cargosAtuais } from "@/lib/discord-auth.functions";
import type { DiscordProfile } from "@/lib/discord-oauth";
import { verifyDiscordSession } from "@/lib/discord-session";
import { papelAtual } from "@/lib/papel.server";

const MENSAGEM: Record<Papel, string> = {
  membro: "Acesso restrito aos membros da 2ª DE.",
  instrutor: "Acesso restrito aos instrutores da 2ª DE.",
  "alto-comando": "Acesso restrito ao Alto Comando.",
  desenvolvedor: "Acesso restrito ao desenvolvedor.",
};

/** Porta de toda função do painel: sessão assinada + cargos atuais no servidor Discord. */
export async function exigirPapel(session: string, exigido: Papel): Promise<DiscordProfile> {
  const assinado = await verifyDiscordSession(session);
  if (!assinado) throw new Error("Sessão Discord inválida ou expirada.");
  const profile = { ...assinado, roles: await cargosAtuais(assinado) };
  if (!papelAlcanca(await papelAtual(profile), exigido)) throw new Error(MENSAGEM[exigido]);
  return profile;
}
