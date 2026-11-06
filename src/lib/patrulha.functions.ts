import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { registrarAuditoria } from "@/lib/auditoria.server";
import { notificarPatrulha } from "@/lib/discord.functions";
import { perfilEPapel } from "@/lib/painel-auth.server";
import { acessoPE } from "@/lib/pe.server";

export type RelatorioPatrulha = {
  id: string;
  autor_discord_id: string;
  autor_nome: string;
  data: string;
  inicio: string;
  fim: string;
  viatura: string;
  equipe: string;
  area: string;
  abordagens: number;
  prisoes: number;
  apreensoes: number;
  ocorrencias: string | null;
  observacoes: string | null;
  status: "enviado" | "aprovado" | "devolvido";
  parecer: string | null;
  revisado_por: string | null;
  created_at: string;
};

// A tabela é nova e ainda não está nos tipos gerados do Supabase.
const tabela = () => supabaseAdmin.from("relatorios_patrulha" as never);

async function exigirPE(session: string) {
  // Uma consulta só: o papel já vem calculado junto com o perfil.
  const { profile, papel } = await perfilEPapel(session);
  const acesso = acessoPE(profile, papel);
  if (!acesso.pe) throw new Error("Acesso restrito à Polícia do Exército.");
  return { profile, comando: acesso.comando };
}

const hora = z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido");
const texto = (max: number) => z.string().trim().min(1, "Campo obrigatório").max(max);
const opcional = (max: number) => z.string().trim().max(max).optional();
const contagem = z.coerce.number().int().min(0).max(999);

const RelatorioSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  inicio: hora,
  fim: hora,
  viatura: texto(60),
  equipe: texto(500),
  area: texto(120),
  abordagens: contagem,
  prisoes: contagem,
  apreensoes: contagem,
  ocorrencias: opcional(3000),
  observacoes: opcional(2000),
});

/** O que a tela precisa saber: se é da PE e se comanda (vê e decide todos). */
export const acessoPatrulha = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ session: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { profile, papel } = await perfilEPapel(data.session);
    return acessoPE(profile, papel);
  });

export const enviarRelatorioPatrulha = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ session: z.string(), relatorio: RelatorioSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { profile } = await exigirPE(data.session);
    const r = data.relatorio;
    const autor = profile.nick ?? profile.displayName;
    const { error } = await tabela().insert({
      ...r,
      ocorrencias: r.ocorrencias || null,
      observacoes: r.observacoes || null,
      autor_discord_id: profile.id,
      autor_nome: autor,
    } as never);
    if (error) throw new Error(error.message);
    await registrarAuditoria(profile, "Relatório de patrulha enviado", `${r.data} ${r.area}`);
    await notificarPatrulha({ ...r, autor }).catch((e) => console.warn("[pe] webhook:", e));
    return { ok: true };
  });

export const listarRelatoriosPatrulha = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        session: z.string(),
        busca: z.string().trim().max(60).optional(),
        desde: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        ate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        status: z.enum(["enviado", "aprovado", "devolvido"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { profile, comando } = await exigirPE(data.session);
    let q = tabela()
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    // Patrulheiro vê só os próprios; comando da PE e Alto Comando veem todos.
    if (!comando) q = q.eq("autor_discord_id", profile.id);
    if (data.status) q = q.eq("status", data.status);
    if (data.desde) q = q.gte("data", data.desde);
    if (data.ate) q = q.lte("data", data.ate);
    // Tira os caracteres que mudam o sentido do filtro `or` do PostgREST.
    const busca = data.busca?.replace(/[,()*%\\]/g, "");
    if (busca) {
      q = q.or(`autor_nome.ilike.*${busca}*,equipe.ilike.*${busca}*,area.ilike.*${busca}*`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { relatorios: (rows ?? []) as unknown as RelatorioPatrulha[], comando };
  });

export const decidirRelatorioPatrulha = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        session: z.string(),
        id: z.string().uuid(),
        status: z.enum(["aprovado", "devolvido"]),
        parecer: z.string().trim().max(1000).optional(),
      })
      .refine((d) => d.status === "aprovado" || !!d.parecer, {
        message: "Diga o motivo da devolução.",
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { profile, comando } = await exigirPE(data.session);
    if (!comando) throw new Error("Só o comando da PE aprova ou devolve relatórios.");
    const { data: atual, error: erroBusca } = await tabela()
      .select("status, autor_discord_id")
      .eq("id", data.id)
      .maybeSingle();
    if (erroBusca) throw new Error(erroBusca.message);
    const rel = atual as { status: string; autor_discord_id: string } | null;
    if (!rel) throw new Error("Relatório não encontrado.");
    if (rel.autor_discord_id === profile.id) {
      throw new Error("Outro membro do comando precisa revisar o seu próprio relatório.");
    }
    if (rel.status !== "enviado") throw new Error("Este relatório já foi decidido.");
    // O filtro por status evita que duas decisões ao mesmo tempo se sobrescrevam.
    const { data: alterado, error } = await tabela()
      .update({
        status: data.status,
        parecer: data.parecer || null,
        revisado_por: `${profile.displayName} (${profile.id})`,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", data.id)
      .eq("status", "enviado")
      .select("id");
    if (error) throw new Error(error.message);
    if (!(alterado as unknown[] | null)?.length) throw new Error("Este relatório já foi decidido.");
    await registrarAuditoria(profile, `Relatório de patrulha ${data.status}`, data.id);
    return { ok: true };
  });
