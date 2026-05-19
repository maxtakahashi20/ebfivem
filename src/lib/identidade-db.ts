/** Persistência Supabase: perfil Discord, identidade militar, documentos emitidos */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { DiscordProfile, DiscordRoleTag } from "@/lib/discord-oauth";
import {
  gerarValidade,
  montarIdentidade,
  patenteFromDiscordRoles,
  type IdentidadeGerada,
} from "@/lib/militar-identidade";

type InscricaoRow = {
  id: string;
  protocolo: string;
  nome: string;
  sobrenome: string;
  rg: string;
  status: string;
  created_at: string;
  updated_at?: string;
  discord_id: string;
  discord_user_id?: string | null;
  observacoes_instrutor?: string | null;
};

export async function upsertDiscordMembro(
  profile: DiscordProfile,
  inscricaoId?: string | null,
): Promise<void> {
  const { error } = await supabaseAdmin.from("discord_membros").upsert(
    {
      discord_user_id: profile.id,
      username: profile.username,
      global_name: profile.globalName,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      nick: profile.nick,
      roles_json: profile.roles,
      inscricao_id: inscricaoId ?? null,
      ultimo_login: new Date().toISOString(),
    },
    { onConflict: "discord_user_id" },
  );
  if (error) console.error("[discord_membros]", error.message);
}

function codigoMilitarDiscord(discordUserId: string): string {
  return `CMF-${discordUserId.slice(-6)}`;
}

function isMissingColumnError(message: string): boolean {
  return /discord_user_id|column.*does not exist|schema cache/i.test(message);
}

async function buscarMilitarPorDiscord(discordUserId: string) {
  const codigo = codigoMilitarDiscord(discordUserId);

  const byDiscord = await supabaseAdmin
    .from("militares")
    .select("id, categoria")
    .eq("discord_user_id", discordUserId)
    .maybeSingle();

  if (!byDiscord.error && byDiscord.data) return byDiscord.data;

  if (byDiscord.error && !isMissingColumnError(byDiscord.error.message)) {
    console.error("[militares lookup discord_user_id]", byDiscord.error.message);
  }

  const byCodigo = await supabaseAdmin
    .from("militares")
    .select("id, categoria")
    .eq("codigo", codigo)
    .maybeSingle();

  if (byCodigo.error) {
    console.error("[militares lookup codigo]", byCodigo.error.message);
    return null;
  }
  return byCodigo.data;
}

/** Inclui automaticamente na aba Efetivo → Militares após login Discord. */
export async function sincronizarMilitarEfetivo(profile: DiscordProfile): Promise<void> {
  const patente = patenteFromDiscordRoles(profile.roles);
  const now = new Date().toISOString();
  const codigo = codigoMilitarDiscord(profile.id);
  const existing = await buscarMilitarPorDiscord(profile.id);

  if (existing?.categoria === "instrutor") {
    const { error } = await supabaseAdmin
      .from("militares")
      .update({ nome: profile.displayName, patente, status: "Autenticado", updated_at: now })
      .eq("id", existing.id);
    if (error) console.error("[militares instrutor sync]", error.message);
    return;
  }

  const rowFull = {
    discord_user_id: profile.id,
    codigo,
    nome: profile.displayName,
    patente,
    funcao: `@${profile.username}`,
    categoria: "ativo" as const,
    status: "Autenticado",
    updated_at: now,
  };

  const rowLegacy = {
    codigo,
    nome: profile.displayName,
    patente,
    funcao: `@${profile.username}`,
    categoria: "ativo" as const,
    status: "Autenticado",
    updated_at: now,
  };

  if (existing) {
    let { error } = await supabaseAdmin.from("militares").update(rowFull).eq("id", existing.id);
    if (error && isMissingColumnError(error.message)) {
      ({ error } = await supabaseAdmin.from("militares").update(rowLegacy).eq("id", existing.id));
    }
    if (error) console.error("[militares update]", error.message);
    return;
  }

  let { error } = await supabaseAdmin.from("militares").insert(rowFull);
  if (error && isMissingColumnError(error.message)) {
    ({ error } = await supabaseAdmin.from("militares").insert(rowLegacy));
  }
  if (error) console.error("[militares insert]", error.message);
}

/** Garante que todos em discord_membros apareçam em Militares (ex.: login antes da coluna nova). */
export async function sincronizarTodosDiscordNoEfetivo(): Promise<number> {
  const { data: membros, error } = await supabaseAdmin
    .from("discord_membros")
    .select("discord_user_id, username, global_name, display_name, avatar_url, nick, roles_json")
    .order("ultimo_login", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[discord_membros list]", error.message);
    return 0;
  }
  if (!membros?.length) return 0;

  for (const m of membros) {
    const roles = (Array.isArray(m.roles_json) ? m.roles_json : []) as DiscordRoleTag[];
    const profile: DiscordProfile = {
      id: m.discord_user_id,
      username: m.username,
      globalName: m.global_name,
      displayName: m.display_name,
      avatarUrl: m.avatar_url ?? "",
      nick: m.nick,
      roles,
    };
    await sincronizarMilitarEfetivo(profile);
  }
  return membros.length;
}

export async function vincularDiscordNaInscricao(
  inscricaoId: string,
  discordUserId: string,
  discordHandle?: string,
): Promise<void> {
  const patch: { discord_user_id: string; discord_id?: string } = {
    discord_user_id: discordUserId,
  };
  if (discordHandle) patch.discord_id = discordHandle;
  const { error } = await supabaseAdmin.from("inscricoes").update(patch).eq("id", inscricaoId);
  if (error) console.error("[inscricoes discord]", error.message);
}

export async function sincronizarIdentidadeMilitar(
  inscricao: InscricaoRow,
  discordUserId?: string | null,
): Promise<IdentidadeGerada | null> {
  if (inscricao.status !== "aprovado") return null;

  const gerada = montarIdentidade({
    protocolo: inscricao.protocolo,
    nome: inscricao.nome,
    sobrenome: inscricao.sobrenome,
    rg: inscricao.rg,
    created_at: inscricao.created_at,
  });

  const { deIso, ateIso } = gerarValidade(
    inscricao.created_at ? new Date(inscricao.created_at) : undefined,
  );

  const { error } = await supabaseAdmin.from("identidades_militares").upsert(
    {
      inscricao_id: inscricao.id,
      discord_user_id: discordUserId ?? inscricao.discord_user_id ?? null,
      matricula: gerada.matricula,
      validade_de: deIso,
      validade_ate: ateIso,
      patente: gerada.patente ?? "Soldado",
      qr_payload: JSON.parse(gerada.qrPayload) as Record<string, unknown>,
      ativa: true,
    },
    { onConflict: "inscricao_id" },
  );
  if (error) console.error("[identidades_militares]", error.message);

  return gerada;
}

export async function registrarDocumentoEmitido(input: {
  tipo: string;
  referencia?: string;
  titulo?: string;
  emitidoPorDiscordId?: string;
  inscricaoId?: string;
  destinatario?: string;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("documentos_emitidos").insert({
    tipo: input.tipo,
    referencia: input.referencia ?? null,
    titulo: input.titulo ?? null,
    emitido_por_discord_id: input.emitidoPorDiscordId ?? null,
    inscricao_id: input.inscricaoId ?? null,
    destinatario: input.destinatario ?? null,
  });
  if (error) console.error("[documentos_emitidos]", error.message);
}

export async function buscarInscricaoPorDiscordId(discordUserId: string, username: string) {
  const user = username.toLowerCase().replace(/[%_]/g, "");
  const { data, error } = await supabaseAdmin
    .from("inscricoes")
    .select(
      "id, protocolo, nome, sobrenome, rg, status, observacoes_instrutor, created_at, updated_at, discord_id, discord_user_id",
    )
    .or(
      `discord_user_id.eq.${discordUserId},discord_id.eq.${discordUserId},discord_id.ilike.${user}`,
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw new Error(error.message);
  const list = (data ?? []) as InscricaoRow[];
  return list.find((r) => r.status === "aprovado") ?? list[0] ?? null;
}

export async function obterIdentidadePorInscricao(inscricaoId: string) {
  const { data, error } = await supabaseAdmin
    .from("identidades_militares")
    .select("*")
    .eq("inscricao_id", inscricaoId)
    .eq("ativa", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
