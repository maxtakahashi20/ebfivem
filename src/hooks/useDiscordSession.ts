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
import type { Papel } from "@/lib/access-control";
import { isDiscordSessionInvalidError } from "@/lib/painel-auth-storage";

export function useDiscordSession() {
  const [profile, setProfile] = useState<DiscordProfile | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [papel, setPapel] = useState<Papel>("membro");
  const [desenvolvedor, setDesenvolvedor] = useState(false);
  const [loading, setLoading] = useState(true);
  /** Falha que não é de sessão (Discord ou banco fora): não é "acesso negado". */
  const [erro, setErro] = useState<string | null>(null);

  const validar = useServerFn(validarSessaoDiscord);
  const obterUrl = useServerFn(obterUrlDiscordOAuth);
  const encerrar = useServerFn(encerrarSessaoDiscord);

  const refresh = useCallback(
    async (token?: string | null, tentativa = 0): Promise<void> => {
      const s = token ?? (typeof window !== "undefined" ? localStorage.getItem(DISCORD_SESSION_KEY) : null);
      if (!s) {
        setProfile(null);
        setSession(null);
        setPapel("membro");
        setDesenvolvedor(false);
        setLoading(false);
        return;
      }
      try {
        const res = await validar({ data: { session: s } });
        const p = res.profile;
        const nextSession = res.session ?? s;
        const flags = res as { papel?: Papel; desenvolvedor?: boolean };
        setProfile(p);
        setSession(nextSession);
        setPapel(flags.papel ?? "membro");
        setDesenvolvedor(Boolean(flags.desenvolvedor));
        setErro(null);
        localStorage.setItem(DISCORD_SESSION_KEY, nextSession);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (!msg || isDiscordSessionInvalidError(msg)) {
          localStorage.removeItem(DISCORD_SESSION_KEY);
          setProfile(null);
          setSession(null);
          setPapel("membro");
          setDesenvolvedor(false);
        } else if (tentativa < 3) {
          // Falha passageira: continua "verificando" e tenta de novo (2 s, 4 s, 8 s).
          await new Promise((r) => setTimeout(r, 2000 * 2 ** tentativa));
          return refresh(s, tentativa + 1);
        } else {
          setErro(msg);
        }
      }
      setLoading(false);
    },
    [validar],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async () => {
    sessionStorage.setItem("2de_discord_return", "adm2de");
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
    setPapel("membro");
    setDesenvolvedor(false);
  }, [encerrar]);

  const setSessionToken = useCallback(
    (token: string, p: DiscordProfile) => {
      localStorage.setItem(DISCORD_SESSION_KEY, token);
      setSession(token);
      setProfile(p);
    },
    [],
  );

  return {
    profile,
    session,
    papel,
    desenvolvedor,
    loading,
    erro,
    login,
    logout,
    refresh,
    setSessionToken,
  };
}
