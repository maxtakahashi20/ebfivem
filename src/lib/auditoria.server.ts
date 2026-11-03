import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { DiscordProfile } from "@/lib/discord-oauth";

/** Quem fez o quê no painel. Falha no log não desfaz a ação já concluída. */
export async function registrarAuditoria(autor: DiscordProfile, acao: string, detalhe: string) {
  // `logs` não está nos tipos gerados do Supabase.
  const { error } = await supabaseAdmin.from("logs" as never).insert({
    tipo: "admin",
    usuario: `${autor.displayName} (${autor.id})`,
    acao,
    detalhe: detalhe.slice(0, 500),
  } as never);
  if (error) console.error("[auditoria]", error.message);
}
