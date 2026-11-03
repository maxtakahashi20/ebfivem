import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Rpc = (
  fn: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: boolean | null; error: { message: string } | null }>;

function ipDoCliente(): string {
  const h = getRequest().headers;
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

/** Barra excesso por IP. Se o banco falhar, deixa passar: o recruta não perde a inscrição por isso. */
export async function exigirLimite(acao: string, maximo: number, janelaSegundos: number) {
  // A função é nova e ainda não está nos tipos gerados do Supabase.
  const { data, error } = await (supabaseAdmin.rpc as unknown as Rpc)("registrar_tentativa", {
    p_chave: `${acao}:${ipDoCliente()}`,
    p_maximo: maximo,
    p_janela_segundos: janelaSegundos,
  });
  if (error) {
    console.error("[limite]", error.message);
    return;
  }
  if (data === false) throw new Error("Muitas tentativas. Aguarde alguns minutos e tente de novo.");
}

/** Cloudflare Turnstile. Sem `TURNSTILE_SECRET_KEY`, a checagem fica desligada. */
export async function exigirHumano(token: string | undefined) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token ?? "", remoteip: ipDoCliente() }),
  });
  const { success } = (await res.json()) as { success?: boolean };
  if (!success) throw new Error("Confirme que você não é um robô e tente de novo.");
}
