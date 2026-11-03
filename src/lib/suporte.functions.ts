import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAccessKey } from "@/lib/access-key.server";
import { registrarLog } from "@/lib/logs.server";

const ATENDENTE = "Comando 2ª DE";
const MAX_MENSAGEM = 2000;
const HISTORICO_LIMIT = 200;

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
      autor_nome: "Sistema 2ª DE",
      mensagem: data.nome
        ? `Ticket aberto por ${data.nome} — assunto: ${data.titulo}.`
        : `Ticket aberto — assunto: ${data.titulo}.`,
    });

    await registrarLog("operacional", "SUPORTE", `Novo ticket ${novo.id} — ${data.titulo}`);

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
        status: StatusSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAccessKey(data.accessKey);

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
        ticketId: UuidSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAccessKey(data.accessKey);

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
        ticketId: UuidSchema,
        mensagem: z.string().trim().min(1).max(MAX_MENSAGEM),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAccessKey(data.accessKey);

    const { data: ticket, error: errT } = await supabaseAdmin
      .from("suporte_tickets")
      .select("status, atendente_nome")
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
        autor_nome: ATENDENTE,
        mensagem: data.mensagem,
      })
      .select("*")
      .single();
    if (error || !msg) throw new Error(error?.message ?? "Falha ao enviar mensagem.");

    const updates: Record<string, unknown> = {
      ultima_mensagem_em: new Date().toISOString(),
    };
    if (ticket.status === "aberto") updates.status = "em_atendimento";
    if (!ticket.atendente_nome) updates.atendente_nome = ATENDENTE;
    await supabaseAdmin.from("suporte_tickets").update(updates).eq("id", data.ticketId);

    return { mensagem: msg as SuporteMensagem };
  });

export const encerrarTicketAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accessKey: z.string(),
        ticketId: UuidSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAccessKey(data.accessKey);

    const { error } = await supabaseAdmin
      .from("suporte_tickets")
      .update({ status: "encerrado", ultima_mensagem_em: new Date().toISOString() })
      .eq("id", data.ticketId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("suporte_mensagens").insert({
      ticket_id: data.ticketId,
      autor: "sistema",
      autor_nome: ATENDENTE,
      mensagem: `Atendimento encerrado por ${ATENDENTE}.`,
    });

    return { ok: true };
  });
