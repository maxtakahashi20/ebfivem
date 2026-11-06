import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  assertDiscordOAuthConfigured,
  discordAvatarUrl,
  discordConfig,
  roleColorHex,
  type DiscordProfile,
  type DiscordRoleTag,
} from "@/lib/discord-oauth";
import { signDiscordSession, verifyDiscordSession } from "@/lib/discord-session";
import {
  buscarInscricaoPorDiscordId,
  sincronizarIdentidadeMilitar,
  sincronizarMilitarEfetivo,
  upsertDiscordMembro,
  vincularDiscordNaInscricao,
} from "@/lib/identidade-db";
import { isDesenvolvedor } from "@/lib/access-control";
import { papelAtual } from "@/lib/papel.server";
import { acessoPE } from "@/lib/pe.server";

function resolveRedirectUri(): string {
  const { redirectUri } = discordConfig();
  if (redirectUri) return redirectUri;
  const req = getRequest();
  const host = req?.headers.get("x-forwarded-host") ?? req?.headers.get("host");
  const proto = req?.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}/auth/discord/callback`;
  return "http://localhost:8080/auth/discord/callback";
}

type DiscordApiErrorBody = { message?: string; code?: number };

async function discordApi<T>(
  path: string,
  opts: { token: string; type?: "Bearer" | "Bot" },
  tentativa = 0,
): Promise<T> {
  const authType = opts.type ?? "Bearer";
  let res: Response;
  try {
    res = await fetch(`https://discord.com/api${path}`, {
      headers: { Authorization: `${authType} ${opts.token}` },
    });
  } catch (e) {
    if (tentativa > 0) throw e;
    await new Promise((r) => setTimeout(r, 500));
    return discordApi<T>(path, opts, 1);
  }
  // Limite do Discord (429) ou instabilidade (5xx): espera o que ele pedir (até 3 s) e tenta uma vez.
  if ((res.status === 429 || res.status >= 500) && tentativa === 0) {
    const espera = Math.min(3000, Number(res.headers.get("retry-after") ?? 0.5) * 1000 || 500);
    await new Promise((r) => setTimeout(r, espera));
    return discordApi<T>(path, opts, 1);
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    let parsed: DiscordApiErrorBody = {};
    try {
      parsed = JSON.parse(txt) as DiscordApiErrorBody;
    } catch {
      /* ignore */
    }
    const err = new Error(`Discord API ${res.status}: ${txt.slice(0, 200)}`) as Error & {
      discordCode?: number;
      discordMessage?: string;
    };
    err.discordCode = parsed.code;
    err.discordMessage = parsed.message;
    throw err;
  }
  return res.json() as Promise<T>;
}

function isDiscordApiError(e: unknown): e is Error & { discordCode?: number } {
  return e instanceof Error;
}

type DiscordUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

type GuildMember = {
  nick: string | null;
  roles: string[];
  user?: DiscordUser;
};

type GuildRole = {
  id: string;
  name: string;
  color: number;
  position: number;
};

function mapRoleTags(allRoles: GuildRole[], memberRoleIds: string[]): DiscordRoleTag[] {
  const memberRoleSet = new Set(memberRoleIds);
  return allRoles
    .filter((r) => memberRoleSet.has(r.id) && r.name !== "@everyone")
    .sort((a, b) => b.position - a.position)
    .map((r) => ({
      id: r.id,
      name: r.name,
      color: roleColorHex(r.color),
      position: r.position,
    }));
}

/** Lista cargos do membro via Bot API (mais confiável que só OAuth). */
async function fetchRolesViaBot(
  guildId: string,
  userId: string,
  botToken: string,
): Promise<{ roles: DiscordRoleTag[]; nick: string | null }> {
  const member = await discordApi<GuildMember>(`/guilds/${guildId}/members/${userId}`, {
    token: botToken,
    type: "Bot",
  });
  const roleIds = member.roles ?? [];
  if (!roleIds.length) {
    return { roles: [], nick: member.nick ?? null };
  }
  const allRoles = await discordApi<GuildRole[]>(`/guilds/${guildId}/roles`, {
    token: botToken,
    type: "Bot",
  });
  return {
    roles: mapRoleTags(allRoles, roleIds),
    nick: member.nick ?? null,
  };
}

const CARGOS_CACHE_MS = 60_000;
/** Se o Discord falhar, vale o último cargo confirmado pelo bot há até 10 min; depois disso, recusa. */
const CARGOS_RESERVA_MS = 10 * 60_000;
const cacheCargos = new Map<string, { roles: DiscordRoleTag[]; nick: string | null; em: number }>();
/** Consultas em andamento: várias checagens do mesmo usuário ao mesmo tempo viram uma chamada só. */
const buscando = new Map<string, Promise<{ roles: DiscordRoleTag[]; nick: string | null }>>();

const foraDoServidor = (e: unknown) =>
  isDiscordApiError(e) && (e.discordCode === 10007 || e.discordCode === 10013);

/**
 * Cargos e apelido de agora, nunca os gravados na sessão (que vale 7 dias).
 * Cargo removido perde efeito em até 1 min; quem saiu do servidor perde a sessão.
 * ponytail: cache por instância; compartilhar (Redis/tabela) se o limite do Discord apertar.
 */
async function membroAtual(
  profile: DiscordProfile,
): Promise<{ roles: DiscordRoleTag[]; nick: string | null }> {
  const { guildId, botToken } = discordConfig();
  if (!guildId || !botToken) return { roles: profile.roles, nick: profile.nick ?? null };
  const salvo = cacheCargos.get(profile.id);
  if (salvo && Date.now() - salvo.em < CARGOS_CACHE_MS) return salvo;
  try {
    let consulta = buscando.get(profile.id);
    if (!consulta) {
      consulta = fetchRolesViaBot(guildId, profile.id, botToken).finally(() =>
        buscando.delete(profile.id),
      );
      buscando.set(profile.id, consulta);
    }
    const atual = await consulta;
    cacheCargos.set(profile.id, { ...atual, em: Date.now() });
    return atual;
  } catch (e) {
    if (foraDoServidor(e)) {
      cacheCargos.delete(profile.id);
      throw new Error("Sessão Discord encerrada: você não faz parte do servidor Discord da 2ª DE.");
    }
    console.warn("[discord] membroAtual:", e);
    if (salvo && Date.now() - salvo.em < CARGOS_RESERVA_MS) return salvo;
    throw new Error(
      "Não foi possível confirmar seus cargos no Discord agora. Tente de novo em instantes.",
    );
  }
}

export async function cargosAtuais(profile: DiscordProfile): Promise<DiscordRoleTag[]> {
  return (await membroAtual(profile)).roles;
}

function rolesLoadWarning(e: unknown): string {
  if (isDiscordApiError(e) && e.discordCode === 10004) {
    return "Bot não está no servidor 2ª DE ou DISCORD_GUILD_ID incorreto no .env. Convide o bot no servidor e confira o ID do servidor.";
  }
  if (isDiscordApiError(e) && e.discordCode === 10007) {
    return "Usuário não encontrado no servidor configurado em DISCORD_GUILD_ID.";
  }
  if (isDiscordApiError(e) && e.discordCode === 50001) {
    return "Bot sem permissão no servidor. Reconvide o bot com permissão de ver membros.";
  }
  return "Não foi possível carregar cargos. Verifique DISCORD_BOT_TOKEN e se o bot está no servidor 2ª DE.";
}

async function enrichProfileWithRoles(profile: DiscordProfile): Promise<DiscordProfile> {
  const { botToken } = discordConfig();
  if (!botToken) {
    return {
      ...profile,
      rolesWarning:
        profile.roles.length === 0
          ? "Defina DISCORD_BOT_TOKEN no .env e adicione o bot ao servidor 2ª DE."
          : undefined,
    };
  }

  const { roles, nick } = await membroAtual(profile);
  return {
    ...profile,
    roles,
    nick: nick ?? profile.nick,
    rolesWarning:
      roles.length === 0 ? "Nenhum cargo além de @everyone no servidor 2ª DE." : undefined,
  };
}

async function buildProfile(accessToken: string, guildId: string): Promise<DiscordProfile> {
  const user = await discordApi<DiscordUser>("/users/@me", { token: accessToken });
  let member: GuildMember;
  let rolesWarning: string | undefined;

  try {
    member = await discordApi<GuildMember>(`/users/@me/guilds/${guildId}/member`, {
      token: accessToken,
    });
  } catch (e) {
    if (isDiscordApiError(e) && e.discordCode === 10004) {
      throw new Error(
        "DISCORD_GUILD_ID inválido no .env (Unknown Guild). No Discord: Modo desenvolvedor → botão direito no ícone do servidor 2ª DE → Copiar ID do servidor. Confira também se você entrou no servidor discord.gg/2TETa9Z4Fu.",
      );
    }
    throw new Error(
      "Você precisa estar no servidor Discord da 2ª DE para vincular o perfil. Entre em discord.gg/2TETa9Z4Fu e tente de novo.",
    );
  }

  const { botToken } = discordConfig();
  let roleTags: DiscordRoleTag[] = [];
  let nick = member.nick;

  // Prioridade: Bot API (lê todos os cargos do membro no servidor 2ª DE)
  if (botToken) {
    try {
      const viaBot = await fetchRolesViaBot(guildId, user.id, botToken);
      roleTags = viaBot.roles;
      nick = viaBot.nick ?? nick;
    } catch (e) {
      rolesWarning = rolesLoadWarning(e);
      console.warn("[discord] fetchRolesViaBot:", e);

      // Fallback: cargos vindos do OAuth (guilds.members.read)
      if (member.roles?.length) {
        try {
          const allRoles = await discordApi<GuildRole[]>(`/guilds/${guildId}/roles`, {
            token: botToken,
            type: "Bot",
          });
          roleTags = mapRoleTags(allRoles, member.roles);
        } catch (e2) {
          console.warn("[discord] fallback roles:", e2);
        }
      }
    }
  } else if (member.roles?.length) {
    rolesWarning = "DISCORD_BOT_TOKEN ausente — cargos não podem ser exibidos.";
  }

  const displayName = nick?.trim() || user.global_name?.trim() || user.username;

  return {
    id: user.id,
    username: user.username,
    globalName: user.global_name,
    displayName,
    avatarUrl: discordAvatarUrl(user.id, user.avatar, 256),
    nick,
    roles: roleTags,
    rolesWarning,
  };
}

export const obterUrlDiscordOAuth = createServerFn({ method: "POST" }).handler(async () => {
  const { clientId, guildId } = assertDiscordOAuthConfigured();
  const state = crypto.randomUUID();
  const redirectUri = resolveRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify guilds guilds.members.read",
    state,
    // Quem já autorizou o app volta direto, sem a tela de consentimento do Discord.
    prompt: "none",
  });
  return {
    url: `https://discord.com/api/oauth2/authorize?${params}`,
    state,
    redirectUri,
  };
});

export const completarDiscordOAuth = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().min(1), state: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { clientId, clientSecret, guildId } = assertDiscordOAuthConfigured();
    const redirectUri = resolveRedirectUri();

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code: data.code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new Error(`Falha ao obter token Discord: ${err.slice(0, 200)}`);
    }
    const tokenJson = (await tokenRes.json()) as { access_token: string };
    const profile = await buildProfile(tokenJson.access_token, guildId);
    const session = await signDiscordSession(profile);

    const inscricao = await buscarInscricaoPorDiscordId(profile.id, profile.username);
    await upsertDiscordMembro(profile, inscricao?.id ?? null);
    await sincronizarMilitarEfetivo(profile);
    if (inscricao) {
      await vincularDiscordNaInscricao(inscricao.id, profile.id, `${profile.username}`);
      if (inscricao.status === "aprovado") {
        await sincronizarIdentidadeMilitar(inscricao, profile.id);
      }
    }

    return {
      profile,
      session,
      inscricaoId: inscricao?.id ?? null,
      papel: await papelAtual(profile),
      desenvolvedor: isDesenvolvedor(profile),
    };
  });

export const validarSessaoDiscord = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ session: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const profile = await verifyDiscordSession(data.session);
    if (!profile) throw new Error("Sessão Discord expirada. Entre novamente.");

    const { guildId } = discordConfig();
    if (!guildId) {
      const papel = await papelAtual(profile);
      return {
        profile,
        session: data.session,
        papel,
        desenvolvedor: isDesenvolvedor(profile),
        pe: acessoPE(profile, papel).pe,
      };
    }

    const refreshed = await enrichProfileWithRoles(profile);
    const session = await signDiscordSession(refreshed);
    const inscricao = await buscarInscricaoPorDiscordId(refreshed.id, refreshed.username);
    await upsertDiscordMembro(refreshed, inscricao?.id ?? null);
    await sincronizarMilitarEfetivo(refreshed);
    const papel = await papelAtual(refreshed);
    return {
      profile: refreshed,
      session,
      papel,
      desenvolvedor: isDesenvolvedor(refreshed),
      pe: acessoPE(refreshed, papel).pe,
    };
  });

export const encerrarSessaoDiscord = createServerFn({ method: "POST" }).handler(async () => ({
  ok: true,
}));

/** Abre o painel para quem ainda está no servidor Discord da 2ª DE. */
export const liberarAcessoPainelDiscord = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ session: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const assinado = await verifyDiscordSession(data.session);
    if (!assinado) throw new Error("Sessão Discord inválida ou expirada.");
    const { guildId } = discordConfig();
    const profile = guildId ? await enrichProfileWithRoles(assinado) : assinado;
    const inscricao = await buscarInscricaoPorDiscordId(profile.id, profile.username);
    await upsertDiscordMembro(profile, inscricao?.id ?? null);
    await sincronizarMilitarEfetivo(profile);
    return { profile, papel: await papelAtual(profile), desenvolvedor: isDesenvolvedor(profile) };
  });

export const buscarInscricaoPorDiscord = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ session: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    let profile = await verifyDiscordSession(data.session);
    if (!profile) throw new Error("Sessão inválida");

    const { guildId } = discordConfig();
    if (guildId) {
      profile = await enrichProfileWithRoles(profile);
    }

    const inscricao = await buscarInscricaoPorDiscordId(profile.id, profile.username);
    if (inscricao) {
      await upsertDiscordMembro(profile, inscricao.id);
      await vincularDiscordNaInscricao(inscricao.id, profile.id, profile.username);
    } else {
      await upsertDiscordMembro(profile, null);
    }

    return {
      inscricao: inscricao
        ? {
            protocolo: inscricao.protocolo,
            nome: inscricao.nome,
            sobrenome: inscricao.sobrenome,
            rg: inscricao.rg,
            status: inscricao.status,
            observacoes_instrutor: inscricao.observacoes_instrutor ?? null,
            created_at: inscricao.created_at,
            updated_at: inscricao.updated_at ?? inscricao.created_at,
          }
        : null,
      profile,
    };
  });
