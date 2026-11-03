// Server functions for the 2ª DE enrollment system.
// O painel exige sessão Discord e papel (`exigirPapel`).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { exigirHumano, exigirLimite } from "@/lib/limite.server";
import { registrarAuditoria } from "@/lib/auditoria.server";
import { exigirPapel } from "@/lib/painel-auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  notificarNovaInscricao,
  notificarMudancaStatus,
  enviarLogOperacional,
} from "@/lib/discord.functions";
import { sincronizarIdentidadeMilitar } from "@/lib/identidade-db";


const StatusEnum = z.enum(["pendente", "em_analise", "aprovado", "reprovado"]);

const InscricaoSchema = z.object({
  nome: z.string().trim().min(1).max(80),
  sobrenome: z.string().trim().min(1).max(80),
  rg: z.string().trim().regex(/^\d{1,8}$/, "RG deve conter até 8 dígitos"),
  telefone: z.string().trim().min(1).max(20),
  discord_id: z.string().trim().min(1).max(64),
  turnstileToken: z.string().optional(),
});

export const criarInscricao = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InscricaoSchema.parse(input))
  .handler(async ({ data }) => {
    await exigirHumano(data.turnstileToken);
    await exigirLimite("inscricao", 5, 3600);
    const discordUserId = /^\d{17,20}$/.test(data.discord_id) ? data.discord_id : null;
    const { data: row, error } = await supabaseAdmin
      .from("inscricoes")
      .insert({
        nome: data.nome,
        sobrenome: data.sobrenome,
        rg: data.rg,
        telefone: data.telefone,
        discord_id: data.discord_id,
        discord_user_id: discordUserId,
        motivacao: "",
      })
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

const ProtocoloSchema = z
  .string()
  .trim()
  .regex(/^EB-[0-9A-F]{8}$/i, "Protocolo no formato EB-XXXXXXXX");

/** Ficha só para quem sabe protocolo e RG juntos: um dado só permitiria varrer nomes. */
export const consultarFicha = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ protocolo: ProtocoloSchema, rg: z.string().trim().regex(/^\d{1,8}$/) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await exigirLimite("consulta", 10, 300);
    const { data: row, error } = await supabaseAdmin
      .from("inscricoes")
      .select(camposConsultaConscrito)
      .eq("protocolo", data.protocolo.toUpperCase())
      .eq("rg", data.rg)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? [row] : [];
  });

/** Dados para emitir documento de terceiros: só instrutor. */
export const buscarFichaParaDocumento = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ session: z.string(), protocolo: ProtocoloSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    await exigirPapel(data.session, "instrutor");
    const { data: row, error } = await supabaseAdmin
      .from("inscricoes")
      .select(camposConsultaConscrito)
      .eq("protocolo", data.protocolo.toUpperCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const listarInscricoes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        session: z.string(),
        status: StatusEnum.optional(),
        search: z.string().trim().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await exigirPapel(data.session, "instrutor");
    let q = supabaseAdmin
      .from("inscricoes")
      .select(
        "id, protocolo, nome, sobrenome, rg, telefone, discord_id, status, observacoes_instrutor, created_at, updated_at",
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

export const obterUltimoProtocolo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ session: z.string() }).parse(input))
  .handler(async ({ data }) => {
    await exigirPapel(data.session, "instrutor");
    const { data: row, error } = await supabaseAdmin
      .from("inscricoes")
      .select("protocolo")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row?.protocolo ?? null;
  });

export const obterEstatisticas = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ session: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    await exigirPapel(data.session, "membro");

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
        session: z.string(),
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
    const autor = await exigirPapel(data.session, "instrutor");
    const { data: atualizada, error } = await supabaseAdmin
      .from("inscricoes")
      .update({
        status: data.status,
        observacoes_instrutor: data.observacoes_instrutor ?? null,
      })
      .eq("id", data.id)
      .select("protocolo")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!atualizada) throw new Error("Inscrição não encontrada.");
    await registrarAuditoria(autor, `Inscrição → ${data.status}`, atualizada.protocolo);

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

export const excluirInscricao = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        session: z.string(),
        id: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const autor = await exigirPapel(data.session, "instrutor");

    const { data: row, error: fetchErr } = await supabaseAdmin
      .from("inscricoes")
      .select("protocolo, nome, sobrenome")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!row) throw new Error("Inscrição não encontrada.");

    const { error } = await supabaseAdmin.from("inscricoes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await registrarAuditoria(
      autor,
      "Inscrição excluída",
      `${row.protocolo} (${row.nome} ${row.sobrenome})`,
    );

    enviarLogOperacional({
      acao: "EXCLUSAO",
      descricao: `Inscrição ${row.protocolo} (${row.nome} ${row.sobrenome}) removida do sistema`,
    }).catch(() => {});

    return { ok: true };
  });
