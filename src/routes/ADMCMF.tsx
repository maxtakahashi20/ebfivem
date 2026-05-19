import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  listarInscricoes,
  atualizarInscricao,
  obterEstatisticas,
} from "@/lib/inscricoes.functions";
import { enviarComunicadoDiscord } from "@/lib/discord.functions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { CentralGuerra } from "@/components/admin/CentralGuerra";
import { AdminModuleView } from "@/components/admin/AdminModuleView";
import { DocumentosPainel } from "@/components/admin/DocumentosPainel";
import { PerfilMilitar } from "@/components/military/PerfilMilitar";
import { PENDING_VIEW_KEY } from "@/lib/painel-nav";
import { useDiscordSession } from "@/hooks/useDiscordSession";
import { liberarAcessoPainelDiscord } from "@/lib/discord-auth.functions";
import { DISCORD_SESSION_KEY } from "@/lib/discord-oauth";
import {
  clearPanelAccessKey,
  getPanelAccessKey,
  isDiscordSessionInvalidError,
  setPanelAccessKey,
} from "@/lib/painel-auth-storage";
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

export const Route = createFileRoute("/ADMCMF")({
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
  motivacao: string;
  status: Status;
  observacoes_instrutor: string | null;
  created_at: string;
  updated_at: string;
};
type Stats = {
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
  const [accessKey, setAccessKey] = useState("");
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
    const cachedKey = getPanelAccessKey();

    if (discordTok && cachedKey) {
      setAccessKey(cachedKey);
      setAuthed(true);
      setCheckingDiscord(false);
      liberarPainel({ data: { session: discordTok } })
        .then(({ accessKey: key }) => {
          setPanelAccessKey(key);
          setAccessKey(key);
        })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : "";
          if (!isDiscordSessionInvalidError(msg)) return;
          localStorage.removeItem(DISCORD_SESSION_KEY);
          clearPanelAccessKey();
          setAuthed(false);
          setAccessKey("");
          setAuthError("Sessão Discord expirada. Entre novamente.");
        });
      return;
    }

    if (!discordTok) {
      setCheckingDiscord(false);
      return;
    }

    liberarPainel({ data: { session: discordTok } })
      .then(({ accessKey: key }) => {
        setPanelAccessKey(key);
        setAccessKey(key);
        setAuthed(true);
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Sessão Discord inválida. Entre novamente.";
        if (isDiscordSessionInvalidError(msg)) {
          localStorage.removeItem(DISCORD_SESSION_KEY);
          clearPanelAccessKey();
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
      <div className="mx-auto max-w-md px-6 py-24">
        <div className="field-paper p-8 relative text-center">
          <div className="absolute -top-3 left-6 tag-rank bg-(--color-destructive)">RESTRITO</div>
          <p className="stencil text-xs mb-2 mt-3">PAINEL MEMBRO · CMF</p>
          <p className="font-mono text-sm text-(--color-stencil)">
            {authError ?? (checkingDiscord ? "VERIFICANDO SESSÃO…" : "REDIRECIONANDO PARA O DISCORD…")}
          </p>
          {authError && (
            <button type="button" className="btn-olive w-full mt-6" onClick={iniciarLoginDiscord}>
              ▸ TENTAR NOVAMENTE
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <CentralComando
      accessKey={accessKey}
      onLogout={() => {
        redirecting.current = false;
        clearPanelAccessKey();
        localStorage.removeItem(DISCORD_SESSION_KEY);
        setAccessKey("");
        setAuthError(null);
        setCheckingDiscord(false);
        setAuthed(false);
      }}
    />
  );
}

// ─── Main panel with sidebar ──────────────────────────────────────────────────
function CentralComando({ accessKey, onLogout }: { accessKey: string; onLogout: () => void }) {
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
      <div className="flex min-h-screen w-full admcmf-shell">
        <AdminSidebar
          view={view}
          onViewChange={setView}
          accessKey={accessKey}
          onLogout={onLogout}
        />

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <div className="border-b-2 border-(--color-olive-deep) bg-khaki/70 backdrop-blur sticky top-0 z-30 px-4 py-3 flex items-center gap-3">
            <SidebarTrigger className="text-(--color-olive-deep) hover:bg-olive-deep/10 h-8 w-8" />
            <div className="stencil text-xs hidden md:block">{getViewLabel(view)}</div>
            <div className="ml-auto text-[10px] font-mono text-(--color-stencil)">
              {new Date().toLocaleString("pt-BR")}
            </div>
          </div>

          {/* Page */}
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-6xl">
              <PanelContent
                view={view}
                accessKey={accessKey}
                onLogout={onLogout}
                onViewChange={setView}
              />
            </div>
          </ScrollArea>
        </div>
      </div>
    </SidebarProvider>
  );
}

function PanelContent({
  view,
  accessKey,
  onLogout,
  onViewChange,
}: {
  view: AdminView;
  accessKey: string;
  onLogout: () => void;
  onViewChange: (v: AdminView) => void;
}) {
  switch (view) {
    case "dashboard":
      return <Dashboard accessKey={accessKey} />;
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
          accessKey={accessKey}
          onLogout={onLogout}
          initialStatus="todos"
          title="Inscrições"
          tag="RECRUTAMENTO"
        />
      );
    case "recrutamento-aprovados":
      return (
        <GestaoInscricoes
          accessKey={accessKey}
          onLogout={onLogout}
          initialStatus="aprovado"
          title="Aprovados"
          tag="RECRUTAMENTO"
        />
      );
    case "recrutamento-reprovados":
      return (
        <GestaoInscricoes
          accessKey={accessKey}
          onLogout={onLogout}
          initialStatus="reprovado"
          title="Reprovados"
          tag="RECRUTAMENTO"
        />
      );
    case "recrutamento-analise":
      return (
        <GestaoInscricoes
          accessKey={accessKey}
          onLogout={onLogout}
          initialStatus="em_analise"
          title="Em análise"
          tag="RECRUTAMENTO"
        />
      );
    case "comunicados":
      return <Comunicados accessKey={accessKey} />;
    default:
      return <AdminModuleView view={view} accessKey={accessKey} />;
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ accessKey }: { accessKey: string }) {
  const getStats = useServerFn(obterEstatisticas);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats({ data: { accessKey } })
      .then((s) => setStats(s as Stats))
      .catch(() => toast.error("Falha ao carregar estatísticas"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = stats ? [
    { label: "Total de inscrições",    value: stats.total,         sub: `${stats.ultimos7d} nos últimos 7 dias`, color: "oklch(0.40 0.07 132)" },
    { label: "Pendentes",              value: stats.pendente,      sub: "Aguardando análise",                    color: "oklch(0.72 0.13 80)" },
    { label: "Em análise",             value: stats.em_analise,    sub: "Em revisão pelo instrutor",             color: "oklch(0.55 0.12 230)" },
    { label: "Aprovados",              value: stats.aprovado,      sub: `${stats.aprovadosHoje} aprovados hoje`, color: "oklch(0.50 0.13 145)" },
    { label: "Reprovados",             value: stats.reprovado,     sub: "Inscrições indeferidas",                color: "oklch(0.48 0.18 30)" },
    { label: "Recebidas hoje",         value: stats.hoje,          sub: "Novas inscrições no dia",               color: "oklch(0.40 0.07 132)" },
  ] : [];

  return (
    <div>
      <PageHeader
        tag="PAINEL DE INSTRUTORES"
        title="Dashboard Operacional"
        sub="Visão geral do sistema de recrutamento"
      />

      {loading ? (
        <div className="field-paper p-6 text-center stencil text-xs">CARREGANDO…</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {cards.map((c) => (
            <Card key={c.label} className="field-paper border-0 shadow-none">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="stencil text-[10px]" style={{ color: c.color }}>
                  {c.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="font-display text-4xl" style={{ color: c.color }}>
                  {c.value}
                </div>
                <p className="text-xs text-(--color-stencil) mt-1">{c.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="field-paper border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="stencil text-xs">STATUS DO SISTEMA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatusLine ok label="Banco de dados: operacional" />
          <StatusLine ok label="Sistema de inscrições: ativo" />
          <StatusLine ok={!!process.env.DISCORD_WEBHOOK_URL} label="Integração Discord: configure DISCORD_WEBHOOK_URL no .env" />
          <StatusLine ok label="Painel admin: autenticado" />
        </CardContent>
      </Card>
    </div>
  );
}

function StatusLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-green-600" : "bg-yellow-500"} animate-pulse inline-block`} />
      <span className="text-(--color-stencil)">{label}</span>
    </div>
  );
}

// ─── Gestão de Inscrições ─────────────────────────────────────────────────────
function GestaoInscricoes({
  accessKey,
  onLogout,
  initialStatus = "todos",
  title = "Gestão de Inscrições",
  tag = "PAINEL DE INSTRUTORES",
}: {
  accessKey: string;
  onLogout: () => void;
  initialStatus?: Status | "todos";
  title?: string;
  tag?: string;
}) {
  const listar = useServerFn(listarInscricoes);
  const atualizar = useServerFn(atualizarInscricao);
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
          accessKey,
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
      await atualizar({ data: { accessKey, id: row.id, status, observacoes_instrutor: obs, nome: row.nome, sobrenome: row.sobrenome, protocolo: row.protocolo } });
      toast.success(`Inscrição ${row.protocolo} atualizada`);
      setRows((rs) => rs.map((r) => r.id === row.id ? { ...r, status, observacoes_instrutor: obs } : r));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar");
    }
  }

  const counts = (Object.keys(STATUS_META) as Status[]).map((v) => ({
    v, n: rows.filter((r) => r.status === v).length,
  }));

  return (
    <div>
      <PageHeader
        tag={tag}
        title={title}
        sub={`${rows.length} registros carregados`}
        action={<button onClick={load} className="btn-ghost-olive text-xs">↻ Atualizar</button>}
      />

      {/* Status chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {counts.map((c) => {
          const m = STATUS_META[c.v];
          const active = statusFilter === c.v;
          return (
            <button
              key={c.v}
              onClick={() => setStatusFilter(active ? "todos" : c.v)}
              className={`field-paper px-3 py-2 text-left transition-all ${active ? "ring-2 ring-(--color-olive-deep)" : ""}`}
            >
              <div className="stencil text-[9px]" style={{ color: m.color }}>{m.symbol} {m.label}</div>
              <div className="font-display text-2xl">{c.n}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="field-paper border-0 shadow-none mb-4">
        <CardContent className="pt-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-52">
            <label className="block stencil text-[10px] mb-1">Buscar</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="nome, RG, protocolo, discord…"
              className="font-mono text-sm bg-transparent"
            />
          </div>
          <div>
            <label className="block stencil text-[10px] mb-1">Status</label>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as Status | "todos")}
            >
              <SelectTrigger className="font-mono text-sm bg-transparent w-40">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {(Object.keys(STATUS_META) as Status[]).map((v) => (
                  <SelectItem key={v} value={v}>{STATUS_META[v].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading && <div className="text-center stencil text-xs py-6">CARREGANDO…</div>}

      {/* List */}
      <div className="space-y-2">
        {rows.map((r) => {
          const m = STATUS_META[r.status];
          const open = expanded === r.id;
          return (
            <div key={r.id} className="field-paper">
              <button
                className="w-full p-4 flex flex-wrap items-center gap-4 text-left"
                onClick={() => setExpanded(open ? null : r.id)}
              >
                <div className="font-mono text-sm w-32 shrink-0 text-(--color-stencil)">{r.protocolo}</div>
                <div className="flex-1 min-w-40">
                  <div className="font-display tracking-wide">{r.nome} {r.sobrenome}</div>
                  <div className="text-xs text-(--color-stencil)">RG {r.rg} · {r.discord_id}</div>
                </div>
                <Badge
                  variant={m.variant}
                  style={{ background: m.color + "22", color: m.color, borderColor: m.color + "55" }}
                  className="font-display tracking-widest text-[10px]"
                >
                  {m.symbol} {m.label}
                </Badge>
                <div className="text-xs text-(--color-stencil) w-28 text-right shrink-0">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </div>
                <span className="text-(--color-stencil) text-xs">{open ? "▲" : "▼"}</span>
              </button>

              {open && <InscricaoEditor row={r} onSave={update} />}
            </div>
          );
        })}

        {!loading && rows.length === 0 && (
          <div className="text-center text-(--color-stencil) py-12 stencil text-xs">
            NENHUMA INSCRIÇÃO ENCONTRADA
          </div>
        )}
      </div>
    </div>
  );
}

function InscricaoEditor({ row, onSave }: { row: Row; onSave: (r: Row, s: Status, obs: string) => Promise<void> }) {
  const [status, setStatus] = useState<Status>(row.status);
  const [obs, setObs] = useState(row.observacoes_instrutor ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <div className="border-t border-(--color-border) p-5 grid md:grid-cols-[1fr_300px] gap-5 reveal">
      <div>
        <div className="grid sm:grid-cols-2 gap-3 mb-4 text-sm font-mono">
          <LabelValue label="TELEFONE"    value={row.telefone} />
          <LabelValue label="DISCORD"     value={row.discord_id} />
          <LabelValue label="RG"          value={row.rg} />
          <LabelValue label="PROTOCOLO"   value={row.protocolo} />
          <LabelValue label="APRESENTAÇÃO"     value={new Date(row.created_at).toLocaleString("pt-BR")} />
          <LabelValue label="ATUALIZADO"  value={new Date(row.updated_at).toLocaleString("pt-BR")} />
        </div>

        <div className="mb-4">
          <div className="stencil text-[10px] mb-1">MOTIVAÇÃO</div>
          <p className="text-sm whitespace-pre-wrap p-3 bg-background/60 border border-(--color-border)">
            {row.motivacao}
          </p>
        </div>

        <div>
          <div className="stencil text-[10px] mb-1">OBSERVAÇÕES DO INSTRUTOR</div>
          <Textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            maxLength={2000}
            className="font-mono text-sm bg-transparent min-h-24"
            placeholder="Anotações de comando…"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="stencil text-[10px] mb-1">DEFINIR STATUS</div>
        <div className="flex flex-col gap-2">
          {(Object.keys(STATUS_META) as Status[]).map((v) => {
            const m = STATUS_META[v];
            const sel = status === v;
            return (
              <label
                key={v}
                className={`flex items-center gap-2 p-2 border cursor-pointer transition-all ${
                  sel ? "border-(--color-olive-deep) bg-khaki/50" : "border-transparent"
                }`}
              >
                <input type="radio" name={`st-${row.id}`} checked={sel} onChange={() => setStatus(v)} />
                <span className="font-display tracking-widest text-xs" style={{ color: m.color }}>
                  {m.symbol} {m.label}
                </span>
              </label>
            );
          })}
        </div>

        <Button
          disabled={saving}
          onClick={async () => { setSaving(true); await onSave(row, status, obs); setSaving(false); }}
          className="btn-olive w-full"
          variant="default"
        >
          {saving ? "SALVANDO…" : "▸ CONFIRMAR DECISÃO"}
        </Button>

        <p className="text-[9px] font-mono text-(--color-stencil) text-center">
          Notificará o Discord automaticamente
        </p>
      </div>
    </div>
  );
}

// ─── Comunicados ──────────────────────────────────────────────────────────────
function Comunicados({ accessKey }: { accessKey: string }) {
  const enviar = useServerFn(enviarComunicadoDiscord);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState<"informativo" | "alerta" | "operacao" | "urgente">("informativo");
  const [sending, setSending] = useState(false);

  const tipoMeta = {
    informativo: { label: "Informativo", color: "oklch(0.50 0.13 145)", emoji: "📣" },
    alerta:      { label: "Alerta",      color: "oklch(0.72 0.13 80)",  emoji: "⚠️" },
    operacao:    { label: "Operação",    color: "oklch(0.55 0.12 230)", emoji: "⚔️" },
    urgente:     { label: "Urgente",     color: "oklch(0.48 0.18 30)",  emoji: "🚨" },
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !mensagem.trim()) return;
    setSending(true);
    try {
      await enviar({ data: { accessKey, titulo, mensagem, tipo } });
      toast.success("Comunicado enviado para o Discord.");
      setTitulo("");
      setMensagem("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar comunicado");
    } finally { setSending(false); }
  }

  return (
    <div>
      <PageHeader
        tag="PAINEL DE INSTRUTORES"
        title="Central de Comunicados"
        sub="Envio direto ao canal Discord configurado"
      />

      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        <Card className="field-paper border-0 shadow-none">
          <CardContent className="pt-5">
            <form onSubmit={submit} className="space-y-4">
              {/* Tipo */}
              <div>
                <label className="block stencil text-[10px] mb-2">TIPO DE COMUNICADO</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(tipoMeta) as typeof tipo[]).map((t) => {
                    const m = tipoMeta[t];
                    const sel = tipo === t;
                    return (
                      <label
                        key={t}
                        className={`flex items-center gap-2 p-2 border cursor-pointer transition-all text-xs font-display tracking-widest ${
                          sel ? "border-(--color-olive-deep) bg-khaki/50" : "border-transparent"
                        }`}
                      >
                        <input type="radio" name="tipo" checked={sel} onChange={() => setTipo(t)} />
                        <span style={{ color: m.color }}>{m.emoji} {m.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block stencil text-[10px] mb-1">TÍTULO</label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  maxLength={100}
                  placeholder="Ex: CHAMADA GERAL — TREINAMENTO"
                  className="font-mono text-sm bg-transparent"
                />
              </div>

              <div>
                <label className="block stencil text-[10px] mb-1">MENSAGEM</label>
                <Textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder="Redija o comunicado operacional…"
                  className="font-mono text-sm bg-transparent resize-y"
                />
                <p className="text-[9px] font-mono text-(--color-stencil) text-right mt-1">
                  {mensagem.length}/2000
                </p>
              </div>

              <button
                type="submit"
                disabled={sending || !titulo.trim() || !mensagem.trim()}
                className="btn-olive w-full disabled:opacity-40"
              >
                {sending ? "TRANSMITINDO…" : "▸ TRANSMITIR PARA O DISCORD"}
              </button>
            </form>
          </CardContent>
        </Card>

        <Card className="field-paper border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="stencil text-xs">CONFIGURAÇÃO DISCORD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs font-mono text-(--color-stencil)">
            <p>1. Crie um webhook no canal Discord desejado.</p>
            <p>2. Copie a URL gerada.</p>
            <p>3. Defina no <span className="font-bold">.env</span>:</p>
            <code className="block bg-background/60 border border-(--color-border) p-2 text-[10px] break-all">
              DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
            </code>
            <p>Para logs em canal separado:</p>
            <code className="block bg-background/60 border border-(--color-border) p-2 text-[10px] break-all">
              DISCORD_WEBHOOK_LOG_URL=https://discord.com/api/webhooks/...
            </code>
            <Separator className="my-2" />
            <p className="font-display tracking-widest text-[9px] text-(--color-olive-deep)">
              AUTOMÁTICO AO APROVAR/REPROVAR:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[10px]">
              <li>Nova inscrição recebida</li>
              <li>Aprovação de recruta</li>
              <li>Reprovação de inscrição</li>
              <li>Mudança para em análise</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────
function PageHeader({
  tag, title, sub, action,
}: {
  tag: string; title: string; sub?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <div className="stencil text-xs mb-1">{tag}</div>
        <h1 className="text-3xl">{title}</h1>
        {sub && <p className="text-sm text-(--color-stencil) mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="stencil text-[10px] mb-0.5">{label}</div>
      <div>{value}</div>
    </div>
  );
}

