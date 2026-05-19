// Server functions for the CMF enrollment system.
// Reads/updates are gated by a shared admin key (ACCESS_KEY env, default "26L5").
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  notificarNovaInscricao,
  notificarMudancaStatus,
  enviarLogOperacional,
} from "@/lib/discord.functions";
import { sincronizarIdentidadeMilitar } from "@/lib/identidade-db";

const ACCESS_KEY = () => process.env.ACCESS_KEY || "26L5";

const StatusEnum = z.enum(["pendente", "em_analise", "aprovado", "reprovado"]);

const InscricaoSchema = z.object({
  nome: z.string().trim().min(1).max(80),
  sobrenome: z.string().trim().min(1).max(80),
  rg: z.string().trim().regex(/^\d{1,8}$/, "RG deve conter até 8 dígitos"),
  telefone: z.string().trim().min(8).max(20),
  discord_id: z.string().trim().min(2).max(64),
  motivacao: z.string().trim().min(10).max(2000),
});

export const criarInscricao = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InscricaoSchema.parse(input))
  .handler(async ({ data }) => {
    const discordUserId = /^\d{17,20}$/.test(data.discord_id) ? data.discord_id : null;
    const { data: row, error } = await supabaseAdmin
      .from("inscricoes")
      .insert({ ...data, discord_user_id: discordUserId })
      .select("id, protocolo, rg, status, created_at")
      .single();
    if (error) throw new Error(error.message);

    // Notifica Discord em background (falha silenciosa — não bloqueia o recruta)
    notificarNovaInscricao({
      nome: data.nome,
      sobrenome: data.sobrenome,
      protocolo: row.protocolo,
      rg: data.rg,
      discord_id: data.discord_id,
      created_at: row.created_at,
    }).catch(() => {});

    return row;
  });

const camposConsultaConscrito =
  "protocolo, nome, sobrenome, rg, status, observacoes_instrutor, created_at, updated_at" as const;

export const consultarPorRg = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ rg: z.string().trim().regex(/^\d{1,8}$/) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("inscricoes")
      .select(camposConsultaConscrito)
      .eq("rg", data.rg)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Mesmo formato que consultarPorRg (lista), porém no máximo um registro — protocolo é UNIQUE. */
export const consultarPorProtocolo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        protocolo: z
          .string()
          .trim()
          .regex(/^EB-[0-9A-F]{8}$/i, "Protocolo no formato EB-XXXXXXXX"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const protocolo = data.protocolo.toUpperCase();
    const { data: row, error } = await supabaseAdmin
      .from("inscricoes")
      .select(camposConsultaConscrito)
      .eq("protocolo", protocolo)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? [row] : [];
  });

export const listarInscricoes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accessKey: z.string(),
        status: StatusEnum.optional(),
        search: z.string().trim().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (data.accessKey !== ACCESS_KEY()) {
      throw new Error("Chave de acesso inválida");
    }
    let q = supabaseAdmin
      .from("inscricoes")
      .select(
        "id, protocolo, nome, sobrenome, rg, telefone, discord_id, motivacao, status, observacoes_instrutor, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.status) q = q.eq("status", data.status);
    if (data.search) {
      const s = data.search.replace(/[%_]/g, "");
      q = q.or(
        `nome.ilike.%${s}%,sobrenome.ilike.%${s}%,rg.ilike.%${s}%,protocolo.ilike.%${s}%,discord_id.ilike.%${s}%`,
      );
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const obterEstatisticas = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ accessKey: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    if (data.accessKey !== ACCESS_KEY()) {
      throw new Error("Chave de acesso inválida");
    }

    const { data: rows, error } = await supabaseAdmin
      .from("inscricoes")
      .select("status, created_at");

    if (error) throw new Error(error.message);

    const all = rows ?? [];
    const now = new Date();
    const inicioHoje = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const inicio7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    return {
      total: all.length,
      pendente: all.filter((r) => r.status === "pendente").length,
      em_analise: all.filter((r) => r.status === "em_analise").length,
      aprovado: all.filter((r) => r.status === "aprovado").length,
      reprovado: all.filter((r) => r.status === "reprovado").length,
      hoje: all.filter((r) => r.created_at >= inicioHoje).length,
      ultimos7d: all.filter((r) => r.created_at >= inicio7d).length,
      aprovadosHoje: all.filter(
        (r) => r.status === "aprovado" && r.created_at >= inicioHoje,
      ).length,
    };
  });

export const atualizarInscricao = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accessKey: z.string(),
        id: z.string().uuid(),
        status: StatusEnum,
        observacoes_instrutor: z.string().max(2000).optional().nullable(),
        nome: z.string().optional(),
        sobrenome: z.string().optional(),
        protocolo: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (data.accessKey !== ACCESS_KEY()) {
      throw new Error("Chave de acesso inválida");
    }
    const { error } = await supabaseAdmin
      .from("inscricoes")
      .update({
        status: data.status,
        observacoes_instrutor: data.observacoes_instrutor ?? null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (data.status === "aprovado") {
      const { data: row } = await supabaseAdmin
        .from("inscricoes")
        .select(
          "id, protocolo, nome, sobrenome, rg, status, created_at, discord_id, discord_user_id",
        )
        .eq("id", data.id)
        .maybeSingle();
      if (row) {
        await sincronizarIdentidadeMilitar(row, row.discord_user_id ?? null);
      }
    }

    // Notifica Discord em background
    if (data.nome && data.sobrenome && data.protocolo) {
      notificarMudancaStatus({
        nome: data.nome,
        sobrenome: data.sobrenome,
        protocolo: data.protocolo,
        status: data.status,
        observacoes: data.observacoes_instrutor,
      }).catch(() => {});

      enviarLogOperacional({
        acao: data.status,
        descricao: `Inscrição ${data.protocolo} (${data.nome} ${data.sobrenome}) → ${data.status.toUpperCase()}`,
      }).catch(() => {});
    }

    return { ok: true };
  });
