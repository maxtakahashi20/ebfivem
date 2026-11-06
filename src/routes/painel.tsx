import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  listarInscricoes,
  atualizarInscricao,
  excluirInscricao,
  obterEstatisticas,
} from "@/lib/inscricoes.functions";
import { enviarComunicadoDiscord } from "@/lib/discord.functions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Kpi, PanelLabel, StatusBadge, TOM, type Tom } from "@/components/admin/panel-ui";
import { ChevronDown, ExternalLink, MessageSquare, RefreshCw, Search, Send, Trash2 } from "lucide-react";
import logo from "@/assets/logo-2de.png";
import { AdminPageTransition } from "@/components/admin/AdminPageTransition";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { CentralGuerra } from "@/components/admin/CentralGuerra";
import { AdminModuleView } from "@/components/admin/AdminModuleView";
import { UltimoProtocolo } from "@/components/admin/UltimoProtocolo";
import { DocumentosPainel } from "@/components/admin/DocumentosPainel";
import { SuporteAdmin } from "@/components/admin/SuporteAdmin";
import { PatrulhaPE } from "@/components/admin/PatrulhaPE";
import { PerfilMilitar } from "@/components/military/PerfilMilitar";
import { PENDING_VIEW_KEY } from "@/lib/painel-nav";
import { useDiscordSession } from "@/hooks/useDiscordSession";
import { liberarAcessoPainelDiscord } from "@/lib/discord-auth.functions";
import { DISCORD_SESSION_KEY } from "@/lib/discord-oauth";
import { getDiscordSessionToken, isDiscordSessionInvalidError } from "@/lib/painel-auth-storage";
import { type AdminView, getViewLabel } from "@/config/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Comando · Painel de Instrutores" },
      { name: "description", content: "Painel restrito de instrutores. Acesso via Discord." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Comando,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = "pendente" | "em_analise" | "aprovado" | "reprovado";
type Row = {
  id: string;
  protocolo: string;
  nome: string;
  sobrenome: string;
  rg: string;
  telefone: string;
  discord_id: string;
  status: Status;
  observacoes_instrutor: string | null;
  created_at: string;
  updated_at: string;
};
type Stats = {
  /** Inscrições por dia, dos 14 dias até hoje (último = hoje). */
  porDia?: number[];
  total: number;
  pendente: number;
  em_analise: number;
  aprovado: number;
  reprovado: number;
  hoje: number;
  ultimos7d: number;
  aprovadosHoje: number;
};

const STATUS_META: Record<Status, { label: string; color: string; symbol: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente:   { label: "Pendente",   color: "oklch(0.72 0.13 80)",   symbol: "⏳", variant: "outline" },
  em_analise: { label: "Em análise", color: "oklch(0.55 0.12 230)",  symbol: "🔍", variant: "secondary" },
  aprovado:   { label: "Aprovado",   color: "oklch(0.50 0.13 145)",  symbol: "✅", variant: "default" },
  reprovado:  { label: "Reprovado",  color: "oklch(0.48 0.18 30)",   symbol: "❌", variant: "destructive" },
};

// ─── Acesso: somente Discord OAuth ───────────────────────────────────────────
function Comando() {
  const [authed, setAuthed] = useState(false);
  const [checkingDiscord, setCheckingDiscord] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const redirecting = useRef(false);
  const { login: loginDiscord } = useDiscordSession();
  const liberarPainel = useServerFn(liberarAcessoPainelDiscord);

  const iniciarLoginDiscord = () => {
    setAuthError(null);
    redirecting.current = true;
    loginDiscord().catch((e) => {
      redirecting.current = false;
      setAuthError(e instanceof Error ? e.message : "Não foi possível abrir o login Discord.");
    });
  };

  useEffect(() => {
    const discordTok = localStorage.getItem(DISCORD_SESSION_KEY);

    if (!discordTok) {
      setCheckingDiscord(false);
      return;
    }

    liberarPainel({ data: { session: discordTok } })
      .then(() => setAuthed(true))
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Sessão Discord inválida. Entre novamente.";
        if (isDiscordSessionInvalidError(msg)) {
          localStorage.removeItem(DISCORD_SESSION_KEY);
        }
        setAuthError(msg);
      })
      .finally(() => setCheckingDiscord(false));
  }, [liberarPainel]);

  useEffect(() => {
    if (authed || checkingDiscord || redirecting.current) return;
    if (localStorage.getItem(DISCORD_SESSION_KEY)) return;
    iniciarLoginDiscord();
  }, [authed, checkingDiscord]);

  if (!authed) {
    return (
      <div className="adm2de-shell min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
        <div
          className="hidden lg:flex flex-col justify-between p-14 bg-cover bg-center"
          style={{ backgroundImage: "linear-gradient(180deg, #0d120a99, #0d120af2), url(/galeria/123145.webp)" }}
        >
          <div className="flex items-center gap-3">
            <img src={logo} alt="2ª DE" className="h-11 w-11 object-contain" />
            <span className="font-display text-[22px] font-semibold tracking-[0.15em] text-[#d9d2b5]">2ª DE</span>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-mono text-xs tracking-[0.14em] text-(--color-olive-bright)">ÁREA RESTRITA</span>
            <p className="font-display text-[56px] font-semibold leading-[1.05] text-[#f3f2ea]">
              O comando da tropa
              <br />
              começa aqui.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-105 flex flex-col gap-6">
            <span className="font-mono text-xs tracking-[0.14em] text-(--color-olive-bright)">PAINEL · 2ª DE</span>
            <h1 className="font-display text-4xl font-semibold">Entre com o Discord</h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              {authError ??
                (checkingDiscord
                  ? "Verificando a sua sessão…"
                  : "Abrindo o login do Discord. O acesso é liberado pelo seu cargo no servidor da 2ª DE.")}
            </p>
            {authError && (
              <button
                type="button"
                className="h-14 w-full flex items-center justify-center gap-3 bg-[#5865f2] font-display font-semibold tracking-[0.12em] text-white hover:brightness-110"
                // Sessão ainda guardada = falha passageira: confere de novo em vez de pedir login.
                onClick={() =>
                  localStorage.getItem(DISCORD_SESSION_KEY)
                    ? window.location.reload()
                    : iniciarLoginDiscord()
                }
              >
                <MessageSquare className="size-5" />
                {localStorage.getItem(DISCORD_SESSION_KEY) ? "TENTAR NOVAMENTE" : "ENTRAR COM DISCORD"}
              </button>
            )}
            <dl className="pt-2">
              {[
                ["MEMBRO", "Identidade e documentos", "text-muted-foreground"],
                ["INSTRUTOR", "+ Recrutamento", "text-(--color-olive-bright)"],
                ["ALTO COMANDO", "+ Comando, Discord, Disciplina", "text-(--color-gold)"],
              ].map(([k, v, c]) => (
                <div key={k} className="flex justify-between py-3 border-t border-border">
                  <dt className={`font-mono text-[11px] tracking-[0.14em] ${c}`}>{k}</dt>
                  <dd className="text-sm text-muted-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <a href="/" className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground hover:text-foreground">
              ← VOLTAR AO SITE
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CentralComando
      onLogout={() => {
        redirecting.current = false;
        localStorage.removeItem(DISCORD_SESSION_KEY);
        setAuthError(null);
        setCheckingDiscord(false);
        setAuthed(false);
      }}
    />
  );
}

// ─── Main panel with sidebar ──────────────────────────────────────────────────
function CentralComando({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<AdminView>(() => {
    if (typeof window === "undefined") return "dashboard";
    const pending = sessionStorage.getItem(PENDING_VIEW_KEY) as AdminView | null;
    if (pending) {
      sessionStorage.removeItem(PENDING_VIEW_KEY);
      return pending;
    }
    return "dashboard";
  });

  return (
    <SidebarProvider
      style={{ "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}
    >
      <UltimoProtocolo />
      <div className="flex min-h-screen w-full adm2de-shell">
        <AdminSidebar
          view={view}
          onViewChange={setView}
          onLogout={onLogout}
        />

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <div className="adm-topbar sticky top-0 z-30 h-16 px-4 md:px-8 flex items-center gap-3 border-b border-border bg-background">
            <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground" />
            <div className="hidden md:flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase">
              <span className="text-muted-foreground/70">Painel</span>
              <span className="text-muted-foreground/70">/</span>
              <span className="text-[#d9d2b5]">{getViewLabel(view)}</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div id="panel-header-slot" />
              <AdminThemeToggle compact />
              <a
                href="/"
                className="hidden sm:inline-flex h-9.5 items-center gap-2 border border-border px-3 text-[13px] text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-3.5" /> Ver site
              </a>
            </div>
          </div>

          {/* Page */}
          <ScrollArea className="flex-1">
            <div className="p-4 md:p-8 max-w-7xl">
              <AdminPageTransition viewKey={view}>
                <PanelContent
                  view={view}
                          onLogout={onLogout}
                  onViewChange={setView}
                />
              </AdminPageTransition>
            </div>
          </ScrollArea>
        </div>
      </div>
    </SidebarProvider>
  );
}

function PanelContent({
  view,
  onLogout,
  onViewChange,
}: {
  view: AdminView;
  onLogout: () => void;
  onViewChange: (v: AdminView) => void;
}) {
  switch (view) {
    case "dashboard":
      return <Dashboard />;
    case "perfil":
      return (
        <PerfilMilitar
          variant="admin"
          onOpenDocumentos={() => onViewChange("documentos")}
        />
      );
    case "documentos":
      return <DocumentosPainel />;
    case "central-guerra":
      return <CentralGuerra />;
    case "recrutamento-inscricoes":
      return (
        <GestaoInscricoes
          onLogout={onLogout}
          initialStatus="todos"
          title="Inscrições"
          tag="RECRUTAMENTO"
        />
      );
    case "recrutamento-aprovados":
      return (
        <GestaoInscricoes
          onLogout={onLogout}
          initialStatus="aprovado"
          title="Aprovados"
          tag="RECRUTAMENTO"
        />
      );
    case "recrutamento-reprovados":
      return (
        <GestaoInscricoes
          onLogout={onLogout}
          initialStatus="reprovado"
          title="Reprovados"
          tag="RECRUTAMENTO"
        />
      );
    case "recrutamento-analise":
      return (
        <GestaoInscricoes
          onLogout={onLogout}
          initialStatus="em_analise"
          title="Em análise"
          tag="RECRUTAMENTO"
        />
      );
    case "comunicados":
      return <Comunicados />;
    case "suporte-admin":
      return <SuporteAdmin />;
    case "pe-patrulha":
      return <PatrulhaPE />;
    default:
      return <AdminModuleView view={view} />;
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
const STATUS_TOM: Record<Status, Tom> = { pendente: "alerta", em_analise: "info", aprovado: "ok", reprovado: "perigo" };

function Dashboard() {
  const getStats = useServerFn(obterEstatisticas);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats({ data: { session: getDiscordSessionToken() } })
      .then((s) => setStats(s as Stats))
      .catch(() => toast.error("Falha ao carregar estatísticas"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const porDia = stats?.porDia ?? [];
  const maxDia = Math.max(1, ...porDia);

  return (
    <div className="flex flex-col gap-7">
      <PageHeader tag="PAINEL DE INSTRUTORES" title="Dashboard operacional" sub={hoje.charAt(0).toUpperCase() + hoje.slice(1)} />

      {loading || !stats ? (
        <div className="border border-border bg-card p-6 text-center font-mono text-xs text-muted-foreground">CARREGANDO…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Kpi label="Total de inscrições" value={stats.total} sub={`+${stats.ultimos7d} nos últimos 7 dias`} />
            <Kpi label="Pendentes" value={stats.pendente} sub="Aguardando análise" tom="alerta" />
            <Kpi label="Em análise" value={stats.em_analise} sub="Com um instrutor" tom="info" />
            <Kpi label="Aprovados" value={stats.aprovado} sub={`${stats.aprovadosHoje} aprovados hoje`} tom="ok" />
            <Kpi label="Reprovados" value={stats.reprovado} sub="Indeferidas" tom="perigo" />
          </div>

          <div className="grid lg:grid-cols-[1fr_400px] gap-4">
            <div className="flex flex-col gap-5 border border-border bg-card p-6 min-h-80">
              <div className="flex justify-between items-baseline">
                <h2 className="font-display text-xl font-medium">Inscrições recebidas</h2>
                <PanelLabel>ÚLTIMOS 14 DIAS · {stats.hoje} HOJE</PanelLabel>
              </div>
              <div className="flex-1 flex items-end gap-2.5 min-h-56">
                {porDia.map((n, i) => {
                  const d = new Date(Date.now() - (porDia.length - 1 - i) * 864e5);
                  return (
                    <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-2" title={`${n} em ${d.toLocaleDateString("pt-BR")}`}>
                      <span className="font-mono text-[10px] text-muted-foreground">{n || ""}</span>
                      <div
                        className={`w-full ${i === porDia.length - 1 ? "bg-(--color-olive-bright)" : "bg-(--color-olive-bright)/35"}`}
                        style={{ height: `${(n / maxDia) * 100}%`, minHeight: n ? 4 : 1 }}
                      />
                      <span className="font-mono text-[10px] text-muted-foreground">{d.getDate()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 border border-border bg-card p-5">
              <h2 className="font-display text-lg font-medium">Status do sistema</h2>
              <StatusLine ok label="Banco de dados" />
              <StatusLine ok label="Inscrições" />
              <StatusLine ok={!!process.env.DISCORD_WEBHOOK_URL} label="Webhook de comunicados" />
              <StatusLine ok label="Painel autenticado" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatusLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <StatusBadge tom={ok ? "ok" : "alerta"}>{ok ? "Operacional" : "Configurar"}</StatusBadge>
    </div>
  );
}

// ─── Gestão de Inscrições ─────────────────────────────────────────────────────
function GestaoInscricoes({
  onLogout,
  initialStatus = "todos",
  title = "Gestão de Inscrições",
  tag = "PAINEL DE INSTRUTORES",
}: {
  onLogout: () => void;
  initialStatus?: Status | "todos";
  title?: string;
  tag?: string;
}) {
  const listar = useServerFn(listarInscricoes);
  const atualizar = useServerFn(atualizarInscricao);
  const excluir = useServerFn(excluirInscricao);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Status | "todos">(initialStatus);

  useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await listar({
        data: {
          session: getDiscordSessionToken(),
          status: statusFilter === "todos" ? undefined : statusFilter,
          search: search || undefined,
        },
      });
      setRows(r as Row[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha");
      if (e instanceof Error && e.message.includes("inválida")) onLogout();
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [statusFilter, search]);

  async function update(row: Row, status: Status, obs: string) {
    try {
      await atualizar({ data: { session: getDiscordSessionToken(), id: row.id, status, observacoes_instrutor: obs, nome: row.nome, sobrenome: row.sobrenome, protocolo: row.protocolo } });
      toast.success(`Inscrição ${row.protocolo} atualizada`);
      setRows((rs) => rs.map((r) => r.id === row.id ? { ...r, status, observacoes_instrutor: obs } : r));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar");
    }
  }

  async function remove(row: Row) {
    const ok = window.confirm(
      `Excluir permanentemente a inscrição ${row.protocolo} (${row.nome} ${row.sobrenome})?\n\nEsta ação não pode ser desfeita.`,
    );
    if (!ok) return;
    try {
      await excluir({ data: { session: getDiscordSessionToken(), id: row.id } });
      toast.success(`Inscrição ${row.protocolo} excluída`);
      setRows((rs) => rs.filter((r) => r.id !== row.id));
      setExpanded((id) => (id === row.id ? null : id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir");
    }
  }

  const counts = (Object.keys(STATUS_META) as Status[]).map((v) => ({
    v, n: rows.filter((r) => r.status === v).length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        tag={tag}
        title={title}
        sub="Avalie as fichas, deixe observações e defina o status. O conscrito vê o resultado em Acompanhar."
        action={
          <button onClick={load} className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">
            <RefreshCw className="size-4" /> Atualizar
          </button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 p-1 border border-border bg-card">
          {(["todos", ...(Object.keys(STATUS_META) as Status[])] as const).map((v) => {
            const active = statusFilter === v;
            const n = v === "todos" ? rows.length : counts.find((c) => c.v === v)?.n ?? 0;
            return (
              <button
                key={v}
                onClick={() => setStatusFilter(v)}
                className={`flex items-center gap-2 px-3.5 py-2 text-sm ${active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {v === "todos" ? "Todas" : STATUS_META[v].label}
                <span className={`font-mono text-[11px] ${active ? "text-(--color-olive-bright)" : "opacity-60"}`}>{n}</span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome, RG, protocolo ou Discord…"
            className="h-10 pl-9 bg-card"
          />
        </div>
      </div>

      <div className="border border-border bg-card overflow-x-auto">
        <div className="hidden md:grid grid-cols-[150px_1fr_110px_180px_150px_130px_24px] gap-4 px-5 py-3 border-b border-border">
          {["PROTOCOLO", "CONSCRITO", "RG", "DISCORD", "APRESENTAÇÃO", "STATUS", ""].map((h) => (
            <PanelLabel key={h}>{h}</PanelLabel>
          ))}
        </div>
        {loading && <div className="text-center font-mono text-xs text-muted-foreground py-6">CARREGANDO…</div>}
        {rows.map((r) => {
          const open = expanded === r.id;
          return (
            <div key={r.id} className={`border-b border-border last:border-b-0 ${open ? "bg-secondary" : ""}`}>
              <button
                className="w-full grid grid-cols-[1fr_auto] md:grid-cols-[150px_1fr_110px_180px_150px_130px_24px] items-center gap-x-4 gap-y-1 px-5 py-3.5 text-left hover:bg-secondary/60"
                onClick={() => setExpanded(open ? null : r.id)}
              >
                <span className="font-mono text-xs tracking-wider text-(--color-olive-bright)">{r.protocolo}</span>
                <span className="text-[15px] md:order-none order-first">{r.nome} {r.sobrenome}</span>
                <span className="hidden md:block text-sm text-muted-foreground">{r.rg}</span>
                <span className="hidden md:block text-sm text-muted-foreground truncate">{r.discord_id}</span>
                <span className="hidden md:block text-sm text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
                <span><StatusBadge tom={STATUS_TOM[r.status]}>{STATUS_META[r.status].label}</StatusBadge></span>
                <ChevronDown className={`hidden md:block size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
              </button>

              {open && <InscricaoEditor row={r} onSave={update} onDelete={remove} />}
            </div>
          );
        })}

        {!loading && rows.length === 0 && (
          <div className="text-center text-muted-foreground py-12 font-mono text-xs">NENHUMA INSCRIÇÃO ENCONTRADA</div>
        )}
      </div>
    </div>
  );
}

function InscricaoEditor({
  row,
  onSave,
  onDelete,
}: {
  row: Row;
  onSave: (r: Row, s: Status, obs: string) => Promise<void>;
  onDelete: (r: Row) => Promise<void>;
}) {
  const [status, setStatus] = useState<Status>(row.status);
  const [obs, setObs] = useState(row.observacoes_instrutor ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="px-5 pt-2 pb-7 grid md:grid-cols-[420px_1fr] gap-8 reveal">
      <div className="grid grid-cols-2 gap-4 content-start">
        <LabelValue label="TELEFONE IN GAME" value={row.telefone} />
        <LabelValue label="DISCORD" value={row.discord_id} />
        <LabelValue label="RG" value={row.rg} />
        <LabelValue label="PROTOCOLO" value={row.protocolo} />
        <LabelValue label="APRESENTAÇÃO" value={new Date(row.created_at).toLocaleString("pt-BR")} />
        <LabelValue label="ATUALIZADO" value={new Date(row.updated_at).toLocaleString("pt-BR")} />
      </div>

      <div className="flex flex-col gap-3">
        <PanelLabel>OBSERVAÇÕES DO INSTRUTOR</PanelLabel>
        <Textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          maxLength={2000}
          className="min-h-24 bg-background"
          placeholder="Anotações de comando… (o conscrito vê este texto em Acompanhar)"
        />
        <PanelLabel>DEFINIR STATUS</PanelLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {(Object.keys(STATUS_META) as Status[]).map((v) => {
            const c = TOM[STATUS_TOM[v]];
            const sel = status === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setStatus(v)}
                aria-pressed={sel}
                className="flex items-center justify-center gap-2 border py-2.5 text-sm"
                style={{ borderColor: c, color: c, background: sel ? `${c}33` : "transparent" }}
              >
                <span className="size-2 rounded-full" style={{ background: c }} />
                {STATUS_META[v].label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            disabled={saving || deleting}
            className="inline-flex items-center gap-2 text-sm text-(--color-destructive) hover:underline disabled:opacity-50"
            onClick={async () => {
              setDeleting(true);
              await onDelete(row);
              setDeleting(false);
            }}
          >
            <Trash2 className="size-4" /> {deleting ? "Excluindo…" : "Excluir ficha"}
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline font-mono text-[10px] text-muted-foreground">AVISA O DISCORD AUTOMATICAMENTE</span>
            <button
              type="button"
              disabled={saving || deleting}
              onClick={async () => { setSaving(true); await onSave(row, status, obs); setSaving(false); }}
              className="btn-olive px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {saving ? "SALVANDO…" : "SALVAR AVALIAÇÃO"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Comunicados ──────────────────────────────────────────────────────────────
function Comunicados() {
  const enviar = useServerFn(enviarComunicadoDiscord);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState<"informativo" | "alerta" | "operacao" | "urgente">("informativo");
  const [sending, setSending] = useState(false);

  const tipoMeta = {
    informativo: { label: "Informativo", color: TOM.ok, emoji: "📣" },
    alerta:      { label: "Alerta",      color: TOM.alerta, emoji: "⚠️" },
    operacao:    { label: "Operação",    color: TOM.info, emoji: "⚔️" },
    urgente:     { label: "Urgente",     color: TOM.perigo, emoji: "🚨" },
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !mensagem.trim()) return;
    setSending(true);
    try {
      await enviar({ data: { session: getDiscordSessionToken(), titulo, mensagem, tipo } });
      toast.success("Comunicado enviado para o Discord.");
      setTitulo("");
      setMensagem("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar comunicado");
    } finally { setSending(false); }
  }

  const m = tipoMeta[tipo];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        tag="CENTRAL DE COMUNICAÇÃO"
        title="Comunicados"
        sub="Escreva uma vez: o aviso vai para o canal de comunicados do Discord."
      />

      <div className="grid lg:grid-cols-[1fr_440px] gap-4">
        <form onSubmit={submit} className="flex flex-col gap-4 border border-border bg-card p-6">
          <PanelLabel>TIPO</PanelLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(tipoMeta) as typeof tipo[]).map((t) => {
              const tm = tipoMeta[t];
              const sel = tipo === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  aria-pressed={sel}
                  className="flex items-center justify-center gap-2 border py-2.5 text-sm"
                  style={{ borderColor: tm.color, color: tm.color, background: sel ? `${tm.color}33` : "transparent" }}
                >
                  <span className="size-2 rounded-full" style={{ background: tm.color }} />
                  {tm.label}
                </button>
              );
            })}
          </div>
          <PanelLabel>TÍTULO</PanelLabel>
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={100}
            placeholder="Ex.: CHAMADA GERAL — TREINAMENTO"
            className="h-11 bg-background"
          />
          <PanelLabel>MENSAGEM</PanelLabel>
          <Textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            maxLength={2000}
            rows={8}
            placeholder="Redija o comunicado…"
            className="bg-background resize-y"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] text-muted-foreground">{mensagem.length}/2000</span>
            <button
              type="submit"
              disabled={sending || !titulo.trim() || !mensagem.trim()}
              className="btn-olive inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-40"
            >
              <Send className="size-4" /> {sending ? "ENVIANDO…" : "ENVIAR COMUNICADO"}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 border border-border bg-card p-5">
            <PanelLabel>PRÉVIA NO DISCORD</PanelLabel>
            <div className="flex flex-col gap-2 bg-[#2b2d31] px-4 py-3.5 border-l-4" style={{ borderColor: m.color }}>
              <span className="text-xs font-bold" style={{ color: m.color }}>{m.emoji} {m.label.toUpperCase()}</span>
              <span className="text-[15px] font-bold text-white break-words">{titulo || "Título do comunicado"}</span>
              <span className="text-[13px] leading-snug text-[#dbdee1] whitespace-pre-wrap break-words">
                {mensagem || "A mensagem aparece aqui."}
              </span>
              <span className="text-[11px] text-[#949ba4]">2ª DE</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 border border-border bg-card p-5 text-sm text-muted-foreground">
            <PanelLabel>AVISOS AUTOMÁTICOS</PanelLabel>
            <p>O Discord também recebe, sem ninguém enviar: nova inscrição, aprovação, reprovação e ficha em análise.</p>
            <p className="font-mono text-[11px]">Canal: DISCORD_WEBHOOK_URL · logs: DISCORD_WEBHOOK_LOG_URL</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────
const PageHeader = AdminPageHeader;

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <PanelLabel>{label}</PanelLabel>
      <div className="text-[15px] break-words">{value}</div>
    </div>
  );
}

