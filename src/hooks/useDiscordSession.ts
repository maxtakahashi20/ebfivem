import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  DISCORD_OAUTH_STATE_KEY,
  DISCORD_SESSION_KEY,
  type DiscordProfile,
} from "@/lib/discord-oauth";
import {
  encerrarSessaoDiscord,
  obterUrlDiscordOAuth,
  validarSessaoDiscord,
} from "@/lib/discord-auth.functions";

export function useDiscordSession() {
  const [profile, setProfile] = useState<DiscordProfile | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const validar = useServerFn(validarSessaoDiscord);
  const obterUrl = useServerFn(obterUrlDiscordOAuth);
  const encerrar = useServerFn(encerrarSessaoDiscord);

  const refresh = useCallback(
    async (token?: string | null) => {
      const s = token ?? (typeof window !== "undefined" ? localStorage.getItem(DISCORD_SESSION_KEY) : null);
      if (!s) {
        setProfile(null);
        setSession(null);
        setLoading(false);
        return;
      }
      try {
        const res = await validar({ data: { session: s } });
        const p = res.profile;
        const nextSession = res.session ?? s;
        setProfile(p);
        setSession(nextSession);
        localStorage.setItem(DISCORD_SESSION_KEY, nextSession);
      } catch {
        localStorage.removeItem(DISCORD_SESSION_KEY);
        setProfile(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    },
    [validar],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async () => {
    sessionStorage.setItem("cmf_discord_return", "admcmf");
    const { url, state } = await obterUrl({ data: {} as never });
    sessionStorage.setItem(DISCORD_OAUTH_STATE_KEY, state);
    window.location.href = url;
  }, [obterUrl]);

  const logout = useCallback(async () => {
    try {
      await encerrar();
    } catch {
      /* ignore */
    }
    localStorage.removeItem(DISCORD_SESSION_KEY);
    setProfile(null);
    setSession(null);
  }, [encerrar]);

  const setSessionToken = useCallback(
    (token: string, p: DiscordProfile) => {
      localStorage.setItem(DISCORD_SESSION_KEY, token);
      setSession(token);
      setProfile(p);
    },
    [],
  );

  return { profile, session, loading, login, logout, refresh, setSessionToken };
}
