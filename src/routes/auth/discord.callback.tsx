import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { DISCORD_OAUTH_STATE_KEY, DISCORD_SESSION_KEY } from "@/lib/discord-oauth";
import { PENDING_VIEW_KEY } from "@/lib/painel-nav";
import { setPanelAccessKey } from "@/lib/painel-auth-storage";
import {
  completarDiscordOAuth,
  liberarAcessoPainelDiscord,
} from "@/lib/discord-auth.functions";

const searchSchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute("/auth/discord/callback")({
  validateSearch: (s) => searchSchema.parse(s),
  component: DiscordCallbackPage,
});

function DiscordCallbackPage() {
  const { code, state, error } = Route.useSearch();
  const completar = useServerFn(completarDiscordOAuth);
  const liberarPainel = useServerFn(liberarAcessoPainelDiscord);
  const [msg, setMsg] = useState("AUTENTICANDO VIA DISCORD…");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;

    if (error) {
      toast.error("Login Discord cancelado ou negado.");
      window.location.assign("/ADMCMF");
      return;
    }
    if (!code || !state) {
      setMsg("Código OAuth ausente. Volte e tente novamente.");
      return;
    }

    const saved = sessionStorage.getItem(DISCORD_OAUTH_STATE_KEY);
    if (!saved || saved !== state) {
      toast.error("Sessão OAuth expirada. Clique em Painel Membro e tente de novo.");
      window.location.assign("/ADMCMF");
      return;
    }

    started.current = true;

    (async () => {
      try {
        const { profile, session } = await completar({ data: { code, state } });
        localStorage.setItem(DISCORD_SESSION_KEY, session);

        const { accessKey } = await liberarPainel({ data: { session } });
        setPanelAccessKey(accessKey);
        sessionStorage.removeItem(DISCORD_OAUTH_STATE_KEY);
        sessionStorage.setItem(PENDING_VIEW_KEY, "perfil");

        toast.success(`Bem-vindo, ${profile.displayName}`);
        window.location.assign("/ADMCMF");
      } catch (e) {
        started.current = false;
        const text = e instanceof Error ? e.message : "Falha na autenticação";
        setMsg(text);
        toast.error(text);
      }
    })();
  }, [code, state, error, completar, liberarPainel]);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <div className="field-paper p-8">
        <p className="stencil text-xs mb-2">DISCORD · CMF</p>
        <p className="font-mono text-sm">{msg}</p>
      </div>
    </div>
  );
}
