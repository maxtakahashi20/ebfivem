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

/** Sessão assinada + cargos atuais no Discord + papel (inclui a tag de Alto Comando do efetivo). */
export async function perfilEPapel(session: string): Promise<{ profile: DiscordProfile; papel: Papel }> {
  const assinado = await verifyDiscordSession(session);
  if (!assinado) throw new Error("Sessão Discord inválida ou expirada.");
  const profile = { ...assinado, roles: await cargosAtuais(assinado) };
  return { profile, papel: await papelAtual(profile) };
}

/** Porta de toda função do painel: recusa quem não alcança o papel exigido. */
export async function exigirPapel(session: string, exigido: Papel): Promise<DiscordProfile> {
  const { profile, papel } = await perfilEPapel(session);
  if (!papelAlcanca(papel, exigido)) throw new Error(MENSAGEM[exigido]);
  return profile;
}
