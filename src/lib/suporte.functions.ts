import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { verifyDiscordSession } from "@/lib/discord-session";
import { hasFullAccess } from "@/lib/access-control";
import { enviarLogOperacional } from "@/lib/discord.functions";

const ACCESS_KEY = () => process.env.ACCESS_KEY || "26L5";
const MAX_MENSAGEM = 2000;
const HISTORICO_LIMIT = 200;

function assertAccess(key: string) {
  if (key !== ACCESS_KEY()) throw new Error("Chave de acesso inválida");
}

async function assertAdminAltoComando(session: string) {
  const profile = await verifyDiscordSession(session);
  if (!profile) throw new Error("Sessão Discord inválida.");
  if (!hasFullAccess(profile)) {
    throw new Error("Apenas o Alto Comando pode atender o suporte.");
  }
  return profile;
}

const UuidSchema = z.string().uuid();

const StatusSchema = z.enum(["aberto", "em_atendimento", "encerrado"]);

const TituloSchema = z
  .string()
  .trim()
  .min(3, "Dê um título com pelo menos 3 caracteres.")
  .max(120, "Título muito longo (máx. 120).");

const NomeOpcionalSchema = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export type SuporteTicket = {
  id: string;
  titulo: string;
  protocolo: string | null;
  rg: string | null;
  nome: string | null;
  sobrenome: string | null;
  status: "aberto" | "em_atendimento" | "encerrado";
  atendente_discord_id: string | null;
  atendente_nome: string | null;
  ultima_mensagem_em: string;
  created_at: string;
  updated_at: string;
};

export type SuporteMensagem = {
  id: string;
  ticket_id: string;
  autor: "conscrito" | "militar" | "sistema";
  autor_nome: string | null;
  autor_discord_id: string | null;
  mensagem: string;
  created_at: string;
};

/** Conscrito abre um novo ticket de suporte usando apenas um título. */
export const abrirOuObterTicket = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        titulo: TituloSchema,
        nome: NomeOpcionalSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: novo, error: errIns } = await supabaseAdmin
      .from("suporte_tickets")
      .insert({
        titulo: data.titulo,
        nome: data.nome ?? null,
      })
      .select("*")
      .single();
    if (errIns || !novo) throw new Error(errIns?.message ?? "Falha ao abrir ticket.");

    await supabaseAdmin.from("suporte_mensagens").insert({
      ticket_id: novo.id,
      autor: "sistema",
      autor_nome: "Sistema CMF",
      mensagem: data.nome
        ? `Ticket aberto por ${data.nome} — assunto: ${data.titulo}.`
        : `Ticket aberto — assunto: ${data.titulo}.`,
    });

    enviarLogOperacional({
      acao: "SUPORTE",
      descricao: `Novo ticket de suporte ${novo.id} — ${data.titulo}`,
    }).catch(() => {});

    return {
      ticket: novo as SuporteTicket,
      acessoToken: (await fetchAcessoToken(novo.id)) ?? "",
    };
  });

async function fetchAcessoToken(ticketId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("suporte_tickets")
    .select("acesso_token")
    .eq("id", ticketId)
    .maybeSingle();
  if (error || !data) return null;
  return String(data.acesso_token);
}

async function assertTokenAndGetTicket(ticketId: string, acessoToken: string) {
  const { data, error } = await supabaseAdmin
    .from("suporte_tickets")
    .select("*")
    .eq("id", ticketId)
    .eq("acesso_token", acessoToken)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Ticket inválido ou token expirado.");
  return data as SuporteTicket;
}

export const listarMensagens = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        ticketId: UuidSchema,
        acessoToken: UuidSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const ticket = await assertTokenAndGetTicket(data.ticketId, data.acessoToken);
    const { data: mensagens, error } = await supabaseAdmin
      .from("suporte_mensagens")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true })
      .limit(HISTORICO_LIMIT);
    if (error) throw new Error(error.message);
    return {
      ticket,
      mensagens: (mensagens ?? []) as SuporteMensagem[],
    };
  });

export const enviarMensagemConscrito = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        ticketId: UuidSchema,
        acessoToken: UuidSchema,
        mensagem: z.string().trim().min(1).max(MAX_MENSAGEM),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const ticket = await assertTokenAndGetTicket(data.ticketId, data.acessoToken);
    if (ticket.status === "encerrado") {
      throw new Error("Este ticket foi encerrado. Abra um novo se necessário.");
    }

    const nomeConscrito = [ticket.nome, ticket.sobrenome].filter(Boolean).join(" ") || "Conscrito";

    const { data: msg, error } = await supabaseAdmin
      .from("suporte_mensagens")
      .insert({
        ticket_id: ticket.id,
        autor: "conscrito",
        autor_nome: nomeConscrito,
        mensagem: data.mensagem,
      })
      .select("*")
      .single();
    if (error || !msg) throw new Error(error?.message ?? "Falha ao enviar mensagem.");

    await supabaseAdmin
      .from("suporte_tickets")
      .update({ ultima_mensagem_em: new Date().toISOString() })
      .eq("id", ticket.id);

    return { mensagem: msg as SuporteMensagem };
  });

export const listarTicketsAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accessKey: z.string(),
        session: z.string().min(1),
        status: StatusSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAccess(data.accessKey);
    await assertAdminAltoComando(data.session);

    let q = supabaseAdmin
      .from("suporte_tickets")
      .select("*")
      .order("ultima_mensagem_em", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);

    const { data: tickets, error } = await q;
    if (error) throw new Error(error.message);
    return { tickets: (tickets ?? []) as SuporteTicket[] };
  });

export const listarMensagensAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accessKey: z.string(),
        session: z.string().min(1),
        ticketId: UuidSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAccess(data.accessKey);
    await assertAdminAltoComando(data.session);

    const { data: ticket, error: errT } = await supabaseAdmin
      .from("suporte_tickets")
      .select("*")
      .eq("id", data.ticketId)
      .maybeSingle();
    if (errT) throw new Error(errT.message);
    if (!ticket) throw new Error("Ticket não encontrado.");

    const { data: mensagens, error } = await supabaseAdmin
      .from("suporte_mensagens")
      .select("*")
      .eq("ticket_id", data.ticketId)
      .order("created_at", { ascending: true })
      .limit(HISTORICO_LIMIT);
    if (error) throw new Error(error.message);

    return {
      ticket: ticket as SuporteTicket,
      mensagens: (mensagens ?? []) as SuporteMensagem[],
    };
  });

export const enviarMensagemAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accessKey: z.string(),
        session: z.string().min(1),
        ticketId: UuidSchema,
        mensagem: z.string().trim().min(1).max(MAX_MENSAGEM),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAccess(data.accessKey);
    const profile = await assertAdminAltoComando(data.session);

    const { data: ticket, error: errT } = await supabaseAdmin
      .from("suporte_tickets")
      .select("status, atendente_discord_id")
      .eq("id", data.ticketId)
      .maybeSingle();
    if (errT) throw new Error(errT.message);
    if (!ticket) throw new Error("Ticket não encontrado.");
    if (ticket.status === "encerrado") {
      throw new Error("Ticket encerrado. Reabra ou crie outro.");
    }

    const { data: msg, error } = await supabaseAdmin
      .from("suporte_mensagens")
      .insert({
        ticket_id: data.ticketId,
        autor: "militar",
        autor_nome: profile.displayName,
        autor_discord_id: profile.id,
        mensagem: data.mensagem,
      })
      .select("*")
      .single();
    if (error || !msg) throw new Error(error?.message ?? "Falha ao enviar mensagem.");

    const updates: Record<string, unknown> = {
      ultima_mensagem_em: new Date().toISOString(),
    };
    if (ticket.status === "aberto") {
      updates.status = "em_atendimento";
      updates.atendente_discord_id = profile.id;
      updates.atendente_nome = profile.displayName;
    } else if (!ticket.atendente_discord_id) {
      updates.atendente_discord_id = profile.id;
      updates.atendente_nome = profile.displayName;
    }
    await supabaseAdmin.from("suporte_tickets").update(updates).eq("id", data.ticketId);

    return { mensagem: msg as SuporteMensagem };
  });

export const encerrarTicketAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accessKey: z.string(),
        session: z.string().min(1),
        ticketId: UuidSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAccess(data.accessKey);
    const profile = await assertAdminAltoComando(data.session);

    const { error } = await supabaseAdmin
      .from("suporte_tickets")
      .update({ status: "encerrado", ultima_mensagem_em: new Date().toISOString() })
      .eq("id", data.ticketId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("suporte_mensagens").insert({
      ticket_id: data.ticketId,
      autor: "sistema",
      autor_nome: profile.displayName,
      autor_discord_id: profile.id,
      mensagem: `Atendimento encerrado por ${profile.displayName}.`,
    });

    return { ok: true };
  });
