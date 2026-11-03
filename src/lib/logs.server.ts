import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Registra um evento na tabela `logs` (aba Logs em geral). Falha não bloqueia a ação. */
export async function registrarLog(
  tipo: "admin" | "operacional",
  acao: string,
  detalhe?: string,
): Promise<void> {
  const { error } = await supabaseAdmin.from("logs").insert({
    tipo,
    usuario: tipo === "admin" ? "Painel ADMCMF" : "Sistema CMF",
    acao,
    detalhe: detalhe ?? null,
  });
  if (error) console.error("[logs]", error.message);
}
