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
import { hasFullAccess, isDesenvolvedor } from "@/lib/access-control";

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
): Promise<T> {
  const authType = opts.type ?? "Bearer";
  const res = await fetch(`https://discord.com/api${path}`, {
    headers: { Authorization: `${authType} ${opts.token}` },
  });
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

function rolesLoadWarning(e: unknown): string {
  if (isDiscordApiError(e) && e.discordCode === 10004) {
    return "Bot não está no servidor CMF ou DISCORD_GUILD_ID incorreto no .env. Convide o bot no servidor e confira o ID do servidor.";
  }
  if (isDiscordApiError(e) && e.discordCode === 10007) {
    return "Usuário não encontrado no servidor configurado em DISCORD_GUILD_ID.";
  }
  if (isDiscordApiError(e) && e.discordCode === 50001) {
    return "Bot sem permissão no servidor. Reconvide o bot com permissão de ver membros.";
  }
  return "Não foi possível carregar cargos. Verifique DISCORD_BOT_TOKEN e se o bot está no servidor CMF.";
}

async function enrichProfileWithRoles(
  profile: DiscordProfile,
  guildId: string,
): Promise<DiscordProfile> {
  const { botToken } = discordConfig();
  if (!botToken) {
    return {
      ...profile,
      rolesWarning:
        profile.roles.length === 0
          ? "Defina DISCORD_BOT_TOKEN no .env e adicione o bot ao servidor CMF."
          : undefined,
    };
  }

  try {
    const { roles, nick } = await fetchRolesViaBot(guildId, profile.id, botToken);
    return {
      ...profile,
      roles,
      nick: nick ?? profile.nick,
      rolesWarning: roles.length === 0 ? "Nenhum cargo além de @everyone no servidor CMF." : undefined,
    };
  } catch (e) {
    console.warn("[discord] enrichProfileWithRoles:", e);
    return {
      ...profile,
      rolesWarning: rolesLoadWarning(e),
    };
  }
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
        "DISCORD_GUILD_ID inválido no .env (Unknown Guild). No Discord: Modo desenvolvedor → botão direito no ícone do servidor CMF → Copiar ID do servidor. Confira também se você entrou no servidor discord.gg/F2T248Ytpj.",
      );
    }
    throw new Error(
      "Você precisa estar no servidor Discord do CMF para vincular o perfil. Entre em discord.gg/F2T248Ytpj e tente de novo.",
    );
  }

  const { botToken } = discordConfig();
  let roleTags: DiscordRoleTag[] = [];
  let nick = member.nick;

  // Prioridade: Bot API (lê todos os cargos do membro no servidor CMF)
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

  const displayName =
    nick?.trim() ||
    user.global_name?.trim() ||
    user.username;

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
    prompt: "consent",
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
      await vincularDiscordNaInscricao(
        inscricao.id,
        profile.id,
        `${profile.username}`,
      );
      if (inscricao.status === "aprovado") {
        await sincronizarIdentidadeMilitar(inscricao, profile.id);
      }
    }

    return {
      profile,
      session,
      inscricaoId: inscricao?.id ?? null,
      altoComando: hasFullAccess(profile),
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
      return {
        profile,
        session: data.session,
        altoComando: hasFullAccess(profile),
        desenvolvedor: isDesenvolvedor(profile),
      };
    }

    const refreshed = await enrichProfileWithRoles(profile, guildId);
    const session = await signDiscordSession(refreshed);
    const inscricao = await buscarInscricaoPorDiscordId(refreshed.id, refreshed.username);
    await upsertDiscordMembro(refreshed, inscricao?.id ?? null);
    await sincronizarMilitarEfetivo(refreshed);
    return {
      profile: refreshed,
      session,
      altoComando: hasFullAccess(refreshed),
      desenvolvedor: isDesenvolvedor(refreshed),
    };
  });

export const encerrarSessaoDiscord = createServerFn({ method: "POST" }).handler(async () => ({
  ok: true,
}));

/** Libera chave do painel após OAuth Discord (membro do servidor CMF). */
export const liberarAcessoPainelDiscord = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ session: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    let profile = await verifyDiscordSession(data.session);
    if (!profile) throw new Error("Sessão Discord inválida ou expirada.");
    const { guildId } = discordConfig();
    if (guildId) profile = await enrichProfileWithRoles(profile, guildId);
    const inscricao = await buscarInscricaoPorDiscordId(profile.id, profile.username);
    await upsertDiscordMembro(profile, inscricao?.id ?? null);
    await sincronizarMilitarEfetivo(profile);
    const accessKey = process.env.ACCESS_KEY?.trim() || "26L5";
    return {
      accessKey,
      profile,
      altoComando: hasFullAccess(profile),
      desenvolvedor: isDesenvolvedor(profile),
    };
  });

export const buscarInscricaoPorDiscord = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ session: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    let profile = await verifyDiscordSession(data.session);
    if (!profile) throw new Error("Sessão inválida");

    const { guildId } = discordConfig();
    if (guildId) {
      profile = await enrichProfileWithRoles(profile, guildId);
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
