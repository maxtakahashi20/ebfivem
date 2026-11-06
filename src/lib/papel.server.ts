import type { Papel } from "@/lib/access-control";
import { isDesenvolvedor, papelDoPerfil } from "@/lib/access-control";
import type { DiscordProfile } from "@/lib/discord-oauth";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Papel com os cargos do Discord e a tag de Alto Comando dada no efetivo. */
export async function papelAtual(profile: Pick<DiscordProfile, "id" | "roles">): Promise<Papel> {
  if (isDesenvolvedor(profile)) return "desenvolvedor";
  const { data, error } = await supabaseAdmin
    .from("militares")
    .select("alto_comando")
    .eq("discord_user_id", profile.id)
    .maybeSingle();
  // Sem a coluna (migration não aplicada) ou banco fora: vale só o cargo do Discord.
  if (error) console.warn("[papel] alto_comando:", error.message);
  return papelDoPerfil(profile, data?.alto_comando === true);
}
