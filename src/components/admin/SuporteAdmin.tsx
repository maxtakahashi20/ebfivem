import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useDiscordSession } from "@/hooks/useDiscordSession";
import { getDiscordSessionToken } from "@/lib/painel-auth-storage";
import { papelAlcanca } from "@/lib/access-control";
import {
  encerrarTicketAdmin,
  enviarMensagemAdmin,
  listarMensagensAdmin,
  listarTicketsAdmin,
  type SuporteMensagem,
  type SuporteTicket,
} from "@/lib/suporte.functions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/panel-ui";
import { ErroVerificacao } from "@/components/admin/AdminModuleView";
import { Card, CardContent } from "@/components/ui/card";

const POLL_MS = 3000;
const MAX_LEN = 2000;

type StatusFilter = "todos" | "aberto" | "em_atendimento" | "encerrado";

export function SuporteAdmin() {
  const { papel, loading: verificandoPapel, erro: erroSessao } = useDiscordSession();
  const listarTickets = useServerFn(listarTicketsAdmin);
  const listarMensagens = useServerFn(listarMensagensAdmin);
  const enviar = useServerFn(enviarMensagemAdmin);
  const encerrar = useServerFn(encerrarTicketAdmin);

  const [tickets, setTickets] = useState<SuporteTicket[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("todos");
  const [selected, setSelected] = useState<string | null>(null);
  const [ticket, setTicket] = useState<SuporteTicket | null>(null);
  const [mensagens, setMensagens] = useState<SuporteMensagem[]>([]);

  const [novaMensagem, setNovaMensagem] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const reloadTickets = useCallback(async () => {
    const session = getDiscordSessionToken();
    if (!session) return;
    setLoadingTickets(true);
    try {
      const res = await listarTickets({
        data: {
          session,
          status: filter === "todos" ? undefined : filter,
        },
      });
      setTickets(res.tickets);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao listar tickets");
    } finally {
      setLoadingTickets(false);
    }
  }, [filter, listarTickets]);

  const reloadMensagens = useCallback(async () => {
    const session = getDiscordSessionToken();
    if (!session || !selected) return;
    try {
      const res = await listarMensagens({
        data: { session, ticketId: selected },
      });
      setTicket(res.ticket);
      setMensagens(res.mensagens);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar mensagens");
    }
  }, [listarMensagens, selected]);

  useEffect(() => {
    if (!papelAlcanca(papel, "alto-comando")) return;
    void reloadTickets();
    const id = setInterval(reloadTickets, POLL_MS * 2);
    return () => clearInterval(id);
  }, [papel, reloadTickets]);

  useEffect(() => {
    if (!selected) return;
    void reloadMensagens();
    const id = setInterval(reloadMensagens, POLL_MS);
    return () => clearInterval(id);
  }, [selected, reloadMensagens]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensagens.length]);

  const ticketAtivo = useMemo(
    () => tickets.find((t) => t.id === selected) ?? ticket,
    [tickets, selected, ticket],
  );

  const handleSend = async () => {
    if (!selected || !novaMensagem.trim() || sending) return;
    const session = getDiscordSessionToken();
    if (!session) {
      toast.error("Sessão Discord necessária.");
      return;
    }
    setSending(true);
    try {
      const res = await enviar({
        data: { session, ticketId: selected, mensagem: novaMensagem.trim() },
      });
      setMensagens((prev) => [...prev, res.mensagem]);
      setNovaMensagem("");
      void reloadTickets();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar");
    } finally {
      setSending(false);
    }
  };

  const handleEncerrar = async () => {
    if (!selected) return;
    const session = getDiscordSessionToken();
    if (!session) return;
    const ok = window.confirm("Encerrar este atendimento?");
    if (!ok) return;
    try {
      await encerrar({ data: { session, ticketId: selected } });
      toast.success("Atendimento encerrado");
      void reloadTickets();
      void reloadMensagens();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao encerrar");
    }
  };

  if (!verificandoPapel && (erroSessao || !papelAlcanca(papel, "alto-comando"))) {
    return (
      <div>
        <AdminPageHeader
          tag="SUPORTE"
          title="Suporte ao conscrito"
          sub="Chat ao vivo com candidatos da 2ª DE."
        />
        {erroSessao ? (
          <ErroVerificacao mensagem={erroSessao} />
        ) : (
          <Card className="field-paper border-0 shadow-none">
            <CardContent className="py-10 text-center space-y-3">
              <div className="tag-rank bg-(--color-destructive) text-[10px] inline-block">
                RESTRITO · ALTO COMANDO
              </div>
              <p className="font-display tracking-widest text-(--color-olive-deep)">
                Acesso negado
              </p>
              <p className="text-xs font-mono text-(--color-stencil) max-w-md mx-auto">
                Apenas o Alto Comando atende o suporte ao conscrito.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        tag="SUPORTE"
        title="Suporte ao conscrito"
        sub="Chat ao vivo com candidatos da 2ª DE."
        action={
          <button
            type="button"
            onClick={() => void reloadTickets()}
            className="btn-ghost-olive text-xs"
          >
            ↻ Atualizar
          </button>
        }
      />

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 min-h-[60vh]">
        <Card className="field-paper border-0 shadow-none">
          <CardContent className="p-3 space-y-2">
            <div className="flex gap-1 mb-2 flex-wrap border-b border-border pb-2">
              {(["todos", "aberto", "em_atendimento", "encerrado"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 text-[13px] ${
                    filter === s ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {FILTRO_LABEL[s]}
                </button>
              ))}
            </div>

            {loadingTickets && (
              <p className="stencil text-[10px] text-(--color-stencil)">CARREGANDO…</p>
            )}
            {!loadingTickets && tickets.length === 0 && (
              <p className="text-xs font-mono text-(--color-stencil) text-center py-6">
                Nenhum ticket
              </p>
            )}

            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {tickets.map((t) => {
                const active = t.id === selected;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelected(t.id)}
                    className={`w-full text-left px-4 py-3.5 border-l-3 transition-colors ${
                      active
                        ? "border-l-(--color-olive-bright) bg-secondary"
                        : "border-l-transparent hover:bg-secondary/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-(--color-stencil) uppercase">
                        #{t.id.slice(0, 6)}
                      </span>
                      <StatusPill status={t.status} />
                    </div>
                    <div className="text-[15px] mt-1 wrap-break-word">
                      {t.titulo || "Sem título"}
                    </div>
                    <div className="text-[13px] text-muted-foreground mt-1 truncate">
                      {[t.nome, t.sobrenome].filter(Boolean).join(" ") || "Conscrito anônimo"}
                    </div>
                    <div className="text-[10px] font-mono text-(--color-stencil) mt-1">
                      {new Date(t.ultima_mensagem_em).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="field-paper border-0 shadow-none flex flex-col">
          <CardContent className="p-0 flex-1 flex flex-col">
            {!selected || !ticketAtivo ? (
              <div className="flex-1 flex items-center justify-center text-xs font-mono text-(--color-stencil) py-20">
                Selecione um ticket para iniciar o atendimento.
              </div>
            ) : (
              <>
                <header className="border-b border-border px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="stencil text-[10px] text-(--color-olive-deep)">
                      CHAMADO #{ticketAtivo.id.slice(0, 6).toUpperCase()}
                    </p>
                    <p className="font-display text-xl text-foreground wrap-break-word">
                      {ticketAtivo.titulo || "Sem título"}
                    </p>
                    <p className="text-[10px] font-mono text-(--color-stencil)">
                      {[ticketAtivo.nome, ticketAtivo.sobrenome].filter(Boolean).join(" ") ||
                        "Conscrito anônimo"}
                    </p>
                    <p className="text-[10px] font-mono text-(--color-stencil)">
                      Status:{" "}
                      <span className="uppercase">{ticketAtivo.status.replace("_", " ")}</span>
                      {ticketAtivo.atendente_nome &&
                        ` · atendido por ${ticketAtivo.atendente_nome}`}
                    </p>
                  </div>
                  {ticketAtivo.status !== "encerrado" && (
                    <button
                      type="button"
                      onClick={() => void handleEncerrar()}
                      className="btn-ghost-olive text-[10px] text-(--color-destructive)"
                    >
                      ✕ ENCERRAR
                    </button>
                  )}
                </header>

                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-6 py-5 space-y-3.5"
                >
                  {mensagens.length === 0 && (
                    <p className="text-xs font-mono text-(--color-stencil) text-center mt-8">
                      Sem mensagens.
                    </p>
                  )}
                  {mensagens.map((m) => (
                    <ChatBubble key={m.id} mensagem={m} />
                  ))}
                </div>

                <footer className="border-t border-border px-6 pt-3.5 pb-5 flex gap-2.5">
                  <input
                    type="text"
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value.slice(0, MAX_LEN))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder={
                      ticketAtivo.status === "encerrado"
                        ? "Atendimento encerrado"
                        : "Resposta do Alto Comando…"
                    }
                    disabled={ticketAtivo.status === "encerrado" || sending}
                    className="flex-1 h-11.5 bg-background border border-border px-3.5 text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={!novaMensagem.trim() || sending || ticketAtivo.status === "encerrado"}
                    className="btn-olive text-xs disabled:opacity-50"
                  >
                    {sending ? "…" : "▸ ENVIAR"}
                  </button>
                </footer>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const FILTRO_LABEL: Record<StatusFilter, string> = {
  todos: "Todos",
  aberto: "Abertos",
  em_atendimento: "Em atendimento",
  encerrado: "Encerrados",
};

function StatusPill({ status }: { status: SuporteTicket["status"] }) {
  const tom = status === "aberto" ? "alerta" : status === "em_atendimento" ? "ok" : "neutro";
  return <StatusBadge tom={tom}>{status.replace("_", " ")}</StatusBadge>;
}

function ChatBubble({ mensagem }: { mensagem: SuporteMensagem }) {
  const isMilitar = mensagem.autor === "militar";
  const isSistema = mensagem.autor === "sistema";
  const align = isMilitar ? "items-end" : "items-start";
  const bubble = isSistema
    ? "text-muted-foreground font-mono text-[11px]"
    : isMilitar
      ? "bg-(--color-olive-bright) text-[#0d120a]"
      : "bg-[#d9d2b51a] text-foreground";

  return (
    <div className={`flex flex-col gap-1 ${align}`}>
      <div className={`max-w-[80%] sm:max-w-105 px-4 py-3 text-[15px] leading-snug ${bubble}`}>
        {!isSistema && (
          <p className="text-[10px] font-mono opacity-80 mb-0.5">
            {mensagem.autor_nome ?? (isMilitar ? "Militar" : "Conscrito")}
          </p>
        )}
        <p className="whitespace-pre-wrap wrap-break-word">{mensagem.mensagem}</p>
      </div>
      <span className="text-[9px] font-mono text-(--color-stencil)">
        {new Date(mensagem.created_at).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}
