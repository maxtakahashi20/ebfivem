import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { registrarAuditoria } from "@/lib/auditoria.server";
import { exigirPapel } from "@/lib/painel-auth.server";

export type ItemHierarquia = {
  id: string;
  posto: string;
  nome: string | null;
  funcao: string | null;
  ordem: number;
};

// A tabela é nova e ainda não está nos tipos gerados do Supabase.
const tabela = () => supabaseAdmin.from("hierarquia" as never);

/** Público: a página /hierarquia lê daqui. Ordem menor = mais alto na cadeia. */
export const listarHierarquia = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await tabela()
    .select("id, posto, nome, funcao, ordem")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ItemHierarquia[];
});

const opcional = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => v || null);

export const salvarItemHierarquia = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        session: z.string(),
        id: z.string().uuid().optional(),
        posto: z.string().trim().min(1, "Informe o posto").max(80),
        nome: opcional(120),
        funcao: opcional(160),
        ordem: z.coerce.number().int().min(0).max(9999),
      })
      .parse(input),
  )
  .handler(async ({ data: { session, id, ...item } }) => {
    const autor = await exigirPapel(session, "desenvolvedor");
    const { error } = id
      ? await tabela().update(item as never).eq("id", id)
      : await tabela().insert(item as never);
    if (error) throw new Error(error.message);
    await registrarAuditoria(autor, id ? "Hierarquia editada" : "Hierarquia adicionada", JSON.stringify(item));
    return { ok: true };
  });

export const removerItemHierarquia = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ session: z.string(), id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const autor = await exigirPapel(data.session, "desenvolvedor");
    const { error } = await tabela().delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await registrarAuditoria(autor, "Hierarquia removida", data.id);
    return { ok: true };
  });
