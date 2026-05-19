import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useDiscordSession } from "@/hooks/useDiscordSession";
import { DiscordProfileCard } from "@/components/military/DiscordProfileCard";
import { IdentidadeMilitarDigital } from "@/components/military/IdentidadeMilitarDigital";
import { IdentidadeDiscordQr } from "@/components/military/IdentidadeDiscordQr";
import { buscarInscricaoPorDiscord } from "@/lib/discord-auth.functions";
import { patenteFromDiscordRoles } from "@/lib/militar-identidade";
import { PENDING_VIEW_KEY } from "@/lib/painel-nav";
import { getPanelAccessKey } from "@/lib/painel-auth-storage";

type Inscricao = {
  protocolo: string;
  nome: string;
  sobrenome: string;
  rg: string;
  status: "pendente" | "em_analise" | "aprovado" | "reprovado";
  created_at: string;
};

type Props = {
  variant?: "public" | "admin";
  onOpenDocumentos?: () => void;
};

export function PerfilMilitar({ variant = "public", onOpenDocumentos }: Props) {
  const navigate = useNavigate();
  const { profile, session, loading, login, logout, refresh } = useDiscordSession();
  const buscar = useServerFn(buscarInscricaoPorDiscord);
  const [inscricao, setInscricao] = useState<Inscricao | null>(null);
  const [buscandoInscricao, setBuscandoInscricao] = useState(false);

  useEffect(() => {
    if (variant === "admin") return;
    if (
      session &&
      typeof window !== "undefined" &&
      getPanelAccessKey()
    ) {
      void navigate({ to: "/ADMCMF" });
    }
  }, [session, navigate, variant]);

  useEffect(() => {
    if (!session) {
      setInscricao(null);
      return;
    }
    setBuscandoInscricao(true);
    buscar({ data: { session } })
      .then((r) => setInscricao(r.inscricao as Inscricao | null))
      .catch(() => setInscricao(null))
      .finally(() => setBuscandoInscricao(false));
  }, [session, buscar]);

  if (loading) {
    return (
      <div className="field-paper p-8 text-center stencil text-xs text-(--color-stencil)">
        CARREGANDO PERFIL…
      </div>
    );
  }

  if (!profile || !session) {
    return (
      <div className="space-y-6 max-w-lg">
        <div className="field-paper p-8 text-center">
          <p className="stencil text-xs text-(--color-olive-deep) mb-2">AUTENTICAÇÃO DISCORD</p>
          <h2 className="text-2xl mb-3">Vincular perfil</h2>
          <p className="text-sm text-(--color-stencil) mb-6">
            Entre com sua conta do servidor CMF no Discord. Seu nome, avatar e cargos (tags) serão
            exibidos na identidade militar digital.
          </p>
          <button
            type="button"
            className="btn-olive w-full sm:w-auto"
            onClick={() => {
              if (variant === "admin") {
                sessionStorage.setItem("cmf_discord_return", "admcmf");
                sessionStorage.setItem(PENDING_VIEW_KEY, "perfil");
              } else {
                sessionStorage.setItem("cmf_discord_return", "admcmf");
                sessionStorage.setItem(PENDING_VIEW_KEY, "perfil");
              }
              login().catch((e) =>
                toast.error(e instanceof Error ? e.message : "Falha ao iniciar login Discord"),
              );
            }}
          >
            ▸ ENTRAR COM DISCORD
          </button>
          <p className="text-[10px] text-(--color-stencil) mt-4 font-mono">
            Requer app OAuth configurado no portal Discord Developer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="stencil text-xs text-(--color-olive-deep)">
            {variant === "admin" ? "IDENTIDADE MILITAR DIGITAL" : "PERFIL OPERACIONAL"}
          </p>
          <p className="text-sm text-(--color-stencil)">
            Dados sincronizados com o Discord do CMF.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost-olive text-xs"
            onClick={() => void refresh(session)}
          >
            ↻ ATUALIZAR CARGOS
          </button>
          <button type="button" className="btn-ghost-olive text-xs" onClick={() => void logout()}>
            SAIR DO DISCORD
          </button>
        </div>
      </div>

      <DiscordProfileCard profile={profile} />

      {(!inscricao || inscricao.status !== "aprovado") && <IdentidadeDiscordQr profile={profile} />}

      {buscandoInscricao && (
        <p className="stencil text-xs text-(--color-stencil)">LOCALIZANDO FICHA DE ALISTAMENTO…</p>
      )}

      {!buscandoInscricao && !inscricao && (
        <div className="field-paper p-5 border border-dashed border-(--color-border)">
          <p className="text-sm text-(--color-stencil)">
            Nenhuma inscrição vinculada ao seu Discord. Use o mesmo ID ou usuário informado na ficha
            de alistamento.
          </p>
        </div>
      )}

      {inscricao && (
        <div className="space-y-4">
          <div className="stencil text-xs">
            FICHA · {inscricao.protocolo} ·{" "}
            <span className="uppercase">{inscricao.status.replace("_", " ")}</span>
          </div>
          <IdentidadeMilitarDigital
            aprovado={inscricao.status === "aprovado"}
            discordProfile={profile}
            dados={{
              protocolo: inscricao.protocolo,
              nome: inscricao.nome,
              sobrenome: inscricao.sobrenome,
              rg: inscricao.rg,
              patente: patenteFromDiscordRoles(profile.roles),
              created_at: inscricao.created_at,
            }}
          />
          {variant === "admin" && inscricao.status === "aprovado" && onOpenDocumentos && (
            <p className="text-center pt-4">
              <button
                type="button"
                className="btn-ghost-olive text-xs"
                onClick={onOpenDocumentos}
              >
                ▸ GERAR DOCUMENTOS MILITARES (PDF)
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
