import { createFileRoute, useHydrated } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Send } from "lucide-react";
import { Turnstile } from "@/components/Turnstile";
import { FieldLabel, PageHero, btnPrimary, inputClass } from "@/components/site-ui";
import {
  abrirOuObterTicket,
  enviarMensagemConscrito,
  listarMensagens,
  type SuporteMensagem,
  type SuporteTicket,
} from "@/lib/suporte.functions";

const STORAGE_KEY = "2de_suporte_ticket";
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
      { title: "Suporte ao Conscrito · 2 DE" },
      {
        name: "description",
        content:
          "Canal direto de suporte para candidatos da 2ª DE — abra um chamado informando o assunto.",
      },
    ],
  }),
  component: SuportePage,
});

function SuportePage() {
  const abrir = useServerFn(abrirOuObterTicket);
  const hidratado = useHydrated();
  const [turnstileToken, setTurnstileToken] = useState<string>();
  const [turnstileVersao, setTurnstileVersao] = useState(0);
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
          turnstileToken,
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
      setTurnstileVersao((v) => v + 1);
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

  const hero = (
    <PageHero
      eyebrow="SUPORTE · 2ª DE"
      title="Fale com os Guerreiros."
      sub="Abra um chamado e converse em tempo real com o Alto Comando. Sem login, sem formulário longo."
      img="/galeria/1153.webp"
    />
  );

  if (!stored) {
    return (
      <div className="bg-bone text-ink">
        {hero}
        <div className="mx-auto max-w-7xl px-4 sm:px-10 py-20 md:py-24 flex flex-col lg:flex-row gap-12 lg:gap-20">
          <form onSubmit={handleOpenTicket} className="lg:w-110 shrink-0 flex flex-col gap-5 bg-paper border border-ink/20 p-6 sm:p-9">
            <h2 className="font-display text-[28px] font-medium">Novo chamado</h2>
            <label className="block">
              <FieldLabel>NOME DO TICKET *</FieldLabel>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value.slice(0, 120))}
                placeholder="Ex.: Dúvida sobre prova física"
                className={inputClass}
                required
                minLength={3}
                maxLength={120}
              />
            </label>
            <label className="block">
              <FieldLabel>SEU NOME (opcional)</FieldLabel>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value.slice(0, 120))}
                placeholder="Como devemos te chamar?"
                className={inputClass}
                maxLength={120}
              />
            </label>
            <Turnstile key={turnstileVersao} onToken={setTurnstileToken} />
            <button type="submit" className={`${btnPrimary} w-full`} disabled={submitting || !hidratado}>
              {submitting ? "ABRINDO…" : "ABRIR CHAMADO"} <ArrowRight className="h-4.5 w-4.5" />
            </button>
            <p className="font-mono text-xs text-mute">O chamado fica salvo por 7 dias neste navegador.</p>
          </form>
          <ol className="flex-1">
            <li className="font-mono text-xs tracking-[0.2em] text-(--color-olive)">COMO FUNCIONA</li>
            {[
              ["Dê um título ao chamado", "Um assunto curto, como “Dúvida sobre prova física”."],
              ["Converse em tempo real", "O Alto Comando responde aqui mesmo, assim que abrir o atendimento."],
              ["Volte quando quiser", "O chamado fica salvo neste navegador por 7 dias."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-5 py-6 border-b border-ink/20">
                <span className="font-display text-[28px] text-field">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex flex-col gap-1.5">
                  <span className="font-display text-[21px] font-medium">{t}</span>
                  <span className="text-[15px] text-mute">{d}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  const tituloDisplay = ticket?.titulo ?? stored.titulo;
  const nomeDisplay =
    [ticket?.nome, ticket?.sobrenome].filter(Boolean).join(" ") || stored.nome || "Conscrito";
  const encerrado = ticket?.status === "encerrado";

  return (
    <div className="bg-bone text-ink">
      {hero}
      <div className="mx-auto max-w-5xl px-4 sm:px-10 py-14 md:py-20">
        <div className="bg-ink text-bone flex flex-col h-[70vh] min-h-120">
          <header className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-7 py-5 border-b border-sand/15">
            <div className="min-w-0 flex flex-col gap-1">
              <p className="font-mono text-[11px] tracking-widest text-field truncate uppercase">CHAMADO · {tituloDisplay}</p>
              <p className="font-display text-[22px] truncate">{nomeDisplay}</p>
              <p className="font-mono text-[11px] text-sand/60">
                Status: <span className="uppercase">{(ticket?.status ?? "aberto").replace("_", " ")}</span>
                {ticket?.atendente_nome && ` · atendido por ${ticket.atendente_nome}`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSair}
              className="border border-sand/40 px-4 py-2 font-display text-xs tracking-[0.15em] text-sand hover:bg-sand hover:text-night transition"
            >
              SAIR DO CHAT
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 flex flex-col gap-4">
            {mensagens.length === 0 && (
              <p className="font-mono text-xs text-sand/50 text-center mt-8">Aguardando primeira mensagem…</p>
            )}
            {mensagens.map((m) => (
              <ChatBubble key={m.id} mensagem={m} />
            ))}
            {encerrado && (
              <p className="font-mono text-xs text-center text-[#e08a6c] pt-4">Atendimento encerrado.</p>
            )}
          </div>

          <footer className="flex gap-3 px-5 sm:px-7 pt-4 pb-6 border-t border-sand/15">
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
              placeholder={encerrado ? "Atendimento encerrado" : "Digite sua mensagem…"}
              disabled={encerrado || sending}
              className="flex-1 h-13 bg-night border border-sand/20 px-4 text-bone placeholder:text-sand/40 focus:outline-none focus:ring-2 focus:ring-field disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!novaMensagem.trim() || sending || encerrado}
              aria-label="Enviar mensagem"
              className="h-13 w-13 shrink-0 bg-field text-night flex items-center justify-center hover:brightness-110 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ mensagem }: { mensagem: SuporteMensagem }) {
  const isConscrito = mensagem.autor === "conscrito";
  const hora = new Date(mensagem.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (mensagem.autor === "sistema") {
    return (
      <p className="text-center font-mono text-[11px] text-sand/50">
        {mensagem.mensagem} · {hora}
      </p>
    );
  }

  return (
    <div className={`flex ${isConscrito ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] sm:max-w-110 px-4.5 py-3.5 flex flex-col gap-1.5 ${isConscrito ? "bg-field text-night" : "bg-sand/12 text-bone"}`}>
        <p className={`font-mono text-[11px] ${isConscrito ? "text-night/70" : "text-sand/60"}`}>
          {mensagem.autor_nome ?? (isConscrito ? "Você" : "Militar")} · {hora}
        </p>
        <p className="whitespace-pre-wrap wrap-break-word leading-snug">{mensagem.mensagem}</p>
      </div>
    </div>
  );
}
