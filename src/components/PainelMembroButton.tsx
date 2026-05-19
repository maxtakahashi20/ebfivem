import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useDiscordSession } from "@/hooks/useDiscordSession";
import { DISCORD_SESSION_KEY } from "@/lib/discord-oauth";

/** Botão estilo Discord — abre painel ADMCMF após OAuth */
export function PainelMembroButton() {
  const { session, loading, login } = useDiscordSession();

  if (loading) return null;

  if (session) {
    return (
      <Link
        to="/ADMCMF"
        className="ml-2 tag-rank bg-(--color-olive-bright) hover:opacity-90 shrink-0"
      >
        ◆ Painel Membro
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="ml-2 tag-rank bg-(--color-olive-bright) hover:opacity-90 shrink-0 cursor-pointer"
      onClick={() => {
        sessionStorage.setItem("cmf_discord_return", "admcmf");
        login().catch((e) =>
          toast.error(e instanceof Error ? e.message : "Falha ao conectar com Discord"),
        );
      }}
    >
      ◆ Painel Membro
    </button>
  );
}
