import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  abrirOuObterTicket,
  enviarMensagemConscrito,
  listarMensagens,
  type SuporteMensagem,
  type SuporteTicket,
} from "@/lib/suporte.functions";

const STORAGE_KEY = "cmf_suporte_ticket";
const POLL_MS = 3000;
const MAX_LEN = 2000;

type StoredTicket = {
  ticketId: string;
  acessoToken: string;
  titulo: string;
  nome?: string;
  savedAt: number;
};

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function loadStored(): StoredTicket | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredTicket;
    if (!parsed.ticketId || !parsed.acessoToken) return null;
    if (Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persist(t: StoredTicket) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
}

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte ao Conscrito · CMF" },
      {
        name: "description",
        content:
          "Canal direto de suporte para candidatos do CMF — abra um chamado informando o assunto.",
      },
    ],
  }),
  component: SuportePage,
});

function SuportePage() {
  const abrir = useServerFn(abrirOuObterTicket);
  const listar = useServerFn(listarMensagens);
  const enviar = useServerFn(enviarMensagemConscrito);

  const [stored, setStored] = useState<StoredTicket | null>(null);
  const [ticket, setTicket] = useState<SuporteTicket | null>(null);
  const [mensagens, setMensagens] = useState<SuporteMensagem[]>([]);

  const [titulo, setTitulo] = useState("");
  const [nome, setNome] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [novaMensagem, setNovaMensagem] = useState("");
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStored(loadStored());
  }, []);

  const refresh = useCallback(
    async (s: StoredTicket) => {
      try {
        const res = await listar({
          data: { ticketId: s.ticketId, acessoToken: s.acessoToken },
        });
        setTicket(res.ticket);
        setMensagens(res.mensagens);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("inválido") || msg.includes("expirado")) {
          localStorage.removeItem(STORAGE_KEY);
          setStored(null);
          setTicket(null);
          setMensagens([]);
          toast.error("Ticket expirou. Abra um novo chamado.");
        }
      }
    },
    [listar],
  );

  useEffect(() => {
    if (!stored) return;
    void refresh(stored);
    const id = setInterval(() => refresh(stored), POLL_MS);
    return () => clearInterval(id);
  }, [stored, refresh]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens.length]);

  const handleOpenTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const tituloTrim = titulo.trim();
    if (tituloTrim.length < 3) {
      toast.error("Dê um título com pelo menos 3 caracteres.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await abrir({
        data: {
          titulo: tituloTrim,
          nome: nome.trim() || undefined,
        },
      });
      const novo: StoredTicket = {
        ticketId: res.ticket.id,
        acessoToken: res.acessoToken,
        titulo: res.ticket.titulo,
        nome: res.ticket.nome ?? undefined,
        savedAt: Date.now(),
      };
      persist(novo);
      setStored(novo);
      setTicket(res.ticket);
      toast.success("Chamado aberto. Aguarde o atendimento.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao abrir chamado.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async () => {
    if (!stored || !novaMensagem.trim() || sending) return;
    setSending(true);
    try {
      const res = await enviar({
        data: {
          ticketId: stored.ticketId,
          acessoToken: stored.acessoToken,
          mensagem: novaMensagem.trim(),
        },
      });
      setMensagens((prev) => [...prev, res.mensagem]);
      setNovaMensagem("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  const handleSair = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStored(null);
    setTicket(null);
    setMensagens([]);
    setTitulo("");
    setNome("");
  };

  if (!stored) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="field-paper p-8 space-y-5">
          <div>
            <p className="stencil text-xs text-(--color-olive-deep)">SUPORTE · CMF</p>
            <h1 className="font-display text-2xl tracking-widest text-(--color-olive-deep) mt-1">
              Fale com os Guerreiros
            </h1>
            <p className="text-sm text-(--color-stencil) mt-2">
              Dê um título ao seu chamado e descreva o assunto. O Alto Comando responde em tempo
              real assim que abrir o atendimento.
            </p>
          </div>
          <form onSubmit={handleOpenTicket} className="space-y-3">
            <div>
              <label className="stencil text-[10px] mb-1 block">NOME DO TICKET *</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value.slice(0, 120))}
                placeholder="Ex.: Dúvida sobre prova física"
                className="w-full font-mono text-sm bg-transparent border border-(--color-border) px-3 py-2"
                required
                minLength={3}
                maxLength={120}
              />
            </div>
            <div>
              <label className="stencil text-[10px] mb-1 block">
                SEU NOME <span className="opacity-60">(opcional)</span>
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value.slice(0, 120))}
                placeholder="Como devemos te chamar?"
                className="w-full font-mono text-sm bg-transparent border border-(--color-border) px-3 py-2"
                maxLength={120}
              />
            </div>
            <button type="submit" className="btn-olive w-full" disabled={submitting}>
              {submitting ? "ABRINDO…" : "▸ ABRIR CHAMADO"}
            </button>
          </form>
          <p className="text-[10px] font-mono text-(--color-stencil) text-center">
            O ticket fica salvo por 7 dias neste navegador.
          </p>
        </div>
      </div>
    );
  }

  const tituloDisplay = ticket?.titulo ?? stored.titulo;
  const nomeDisplay =
    [ticket?.nome, ticket?.sobrenome].filter(Boolean).join(" ") || stored.nome || "Conscrito";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="field-paper border-(--color-border) overflow-hidden flex flex-col h-[70vh] min-h-[480px]">
        <header className="border-b border-(--color-border) p-4 flex flex-wrap items-center justify-between gap-3 bg-khaki/40">
          <div className="min-w-0">
            <p className="stencil text-[10px] text-(--color-olive-deep) truncate">
              CHAMADO · {tituloDisplay}
            </p>
            <p className="font-display tracking-widest text-(--color-olive-deep) truncate">
              {nomeDisplay}
            </p>
            <p className="text-[10px] font-mono text-(--color-stencil)">
              Status:{" "}
              <span className="uppercase">
                {(ticket?.status ?? "aberto").replace("_", " ")}
              </span>
              {ticket?.atendente_nome && ` · atendido por ${ticket.atendente_nome}`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSair}
            className="btn-ghost-olive text-[10px]"
          >
            SAIR DO CHAT
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/60">
          {mensagens.length === 0 && (
            <p className="text-xs font-mono text-(--color-stencil) text-center mt-8">
              Aguardando primeira mensagem…
            </p>
          )}
          {mensagens.map((m) => (
            <ChatBubble key={m.id} mensagem={m} />
          ))}
          {ticket?.status === "encerrado" && (
            <p className="text-xs font-mono text-center text-(--color-destructive) pt-4">
              Atendimento encerrado.
            </p>
          )}
        </div>

        <footer className="border-t border-(--color-border) p-3 flex gap-2 bg-khaki/40">
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
              ticket?.status === "encerrado"
                ? "Atendimento encerrado"
                : "Digite sua mensagem…"
            }
            disabled={ticket?.status === "encerrado" || sending}
            className="flex-1 font-mono text-sm bg-transparent border border-(--color-border) px-3 py-2 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={
              !novaMensagem.trim() || sending || ticket?.status === "encerrado"
            }
            className="btn-olive text-xs disabled:opacity-50"
          >
            {sending ? "…" : "▸ ENVIAR"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function ChatBubble({ mensagem }: { mensagem: SuporteMensagem }) {
  const isConscrito = mensagem.autor === "conscrito";
  const isSistema = mensagem.autor === "sistema";
  const align = isConscrito ? "items-end" : "items-start";
  const bubble = isSistema
    ? "bg-(--color-olive-deep)/15 text-(--color-stencil) italic"
    : isConscrito
      ? "bg-(--color-olive-deep) text-(--color-khaki)"
      : "bg-khaki border border-(--color-border)";

  return (
    <div className={`flex flex-col gap-1 ${align}`}>
      <div className={`max-w-[80%] px-3 py-2 text-sm ${bubble}`}>
        {!isSistema && (
          <p className="text-[10px] font-mono opacity-80 mb-0.5">
            {mensagem.autor_nome ?? (isConscrito ? "Conscrito" : "Militar")}
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
