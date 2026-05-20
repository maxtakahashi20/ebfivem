import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import type { AdminView } from "@/config/admin-nav";
import { ALTO_COMANDO_VIEWS } from "@/config/admin-nav";
import { getAcaoEspecial, getLabelAcao, getModuloForm } from "@/config/admin-module-forms";
import { MODULO_DB, PDF_RESTRITO_VIEWS } from "@/config/admin-modules-db";
import {
  AdminModuleFormDialog,
  type AdminFormPdf,
} from "@/components/admin/AdminModuleFormDialog";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getModuleConfig, type ModuleStat } from "@/components/admin/module-registry";
import {
  atualizarStatusDiscordBot,
  baixarPdfRestrito,
  carregarModuloAdmin,
  criarRegistroModulo,
  executarAcaoEspecial,
  removerPdfRestrito,
  uploadPdfRestrito,
} from "@/lib/admin-modules.functions";
import { useDiscordSession } from "@/hooks/useDiscordSession";
import { DISCORD_SESSION_KEY } from "@/lib/discord-oauth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getDiscordSessionToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(DISCORD_SESSION_KEY) ?? undefined;
}

export function AdminModuleView({ view, accessKey }: { view: AdminView; accessKey: string }) {
  const cfg = getModuleConfig(view);
  const { altoComando } = useDiscordSession();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState(cfg.rows);
  const [stats, setStats] = useState<ModuleStat[]>(cfg.stats);
  const [extra, setExtra] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(usesDb(view));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadModulo = useServerFn(carregarModuloAdmin);
  const criarRegistro = useServerFn(criarRegistroModulo);
  const acaoEspecial = useServerFn(executarAcaoEspecial);
  const uploadPdf = useServerFn(uploadPdfRestrito);
  const downloadPdf = useServerFn(baixarPdfRestrito);
  const deletePdf = useServerFn(removerPdfRestrito);

  const isRestrita = ALTO_COMANDO_VIEWS.has(view);
  const acessoNegado = isRestrita && !altoComando;
  const supportsPdf = PDF_RESTRITO_VIEWS.has(view);

  const reload = useCallback(() => {
    if (!usesDb(view)) return;
    if (acessoNegado) return;
    setLoading(true);
    loadModulo({ data: { accessKey, view, session: getDiscordSessionToken() } })
      .then((payload) => {
        setRows(payload.rows);
        if (payload.stats.length > 0) {
          setStats(payload.stats.map((s) => ({ label: s.label, value: s.value, sub: s.sub })));
        }
        if (payload.extra) setExtra(payload.extra);
      })
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Falha ao carregar dados do módulo"),
      )
      .finally(() => setLoading(false));
  }, [accessKey, view, loadModulo, acessoNegado]);

  useEffect(() => {
    if (!usesDb(view)) {
      setRows(cfg.rows);
      setStats(cfg.stats);
      setLoading(false);
      return;
    }
    reload();
  }, [view, accessKey, reload, cfg.rows, cfg.stats]);

  const filtered = rows.filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return Object.values(row).some((v) => v.toLowerCase().includes(q));
  });

  const temFormulario = !!getModuloForm(view);
  const acaoEsp = getAcaoEspecial(view);
  const labelAcao = getLabelAcao(view, cfg.primaryAction);
  const temAcaoHeader = !!(
    labelAcao &&
    cfg.variant !== "defcon" &&
    (temFormulario || acaoEsp || view === "sys-db")
  );

  const handlePrimaryAction = async () => {
    if (view === "sys-db") {
      reload();
      toast.success("Contagens atualizadas");
      return;
    }
    if (acaoEsp) {
      setActionLoading(true);
      try {
        const res = await acaoEspecial({
          data: { accessKey, view, session: getDiscordSessionToken() },
        });
        toast.success(res.mensagem ?? "Ação concluída");
        reload();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha na ação");
      } finally {
        setActionLoading(false);
      }
      return;
    }
    if (temFormulario) setDialogOpen(true);
  };

  const handleFormSubmit = async (
    valores: Record<string, string>,
    pdf: AdminFormPdf | null,
  ) => {
    setSaving(true);
    try {
      const session = getDiscordSessionToken();
      const result = await criarRegistro({ data: { accessKey, view, valores, session } });
      if (pdf) {
        if (!result.id) {
          toast.error("Registro criado, mas não foi possível anexar o PDF (ID ausente).");
        } else if (!session) {
          toast.error("Sessão Discord necessária para anexar PDF.");
        } else {
          await uploadPdf({
            data: {
              accessKey,
              session,
              view,
              recordId: result.id,
              base64: pdf.base64,
              filename: pdf.filename,
              mime: pdf.mime,
            },
          });
        }
      }
      toast.success(pdf ? "Registro salvo com PDF anexado" : "Registro salvo");
      setDialogOpen(false);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async (recordId: string) => {
    const session = getDiscordSessionToken();
    if (!session) {
      toast.error("Sessão Discord necessária.");
      return;
    }
    try {
      const { url, filename } = await downloadPdf({
        data: { accessKey, session, recordId },
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao baixar PDF");
    }
  };

  const handleDeletePdf = async (recordId: string) => {
    const session = getDiscordSessionToken();
    if (!session) {
      toast.error("Sessão Discord necessária.");
      return;
    }
    const ok = window.confirm("Remover o PDF deste registro?");
    if (!ok) return;
    try {
      await deletePdf({ data: { accessKey, session, recordId } });
      toast.success("PDF removido");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao remover PDF");
    }
  };

  if (acessoNegado) {
    return (
      <div>
        <AdminPageHeader tag={cfg.tag} title={cfg.title} sub={cfg.subtitle} />
        <Card className="field-paper border-0 shadow-none">
          <CardContent className="py-10 text-center space-y-3">
            <div className="tag-rank bg-(--color-destructive) text-[10px] inline-block">
              RESTRITO · ALTO COMANDO
            </div>
            <p className="font-display tracking-widest text-(--color-olive-deep)">
              Acesso negado
            </p>
            <p className="text-xs font-mono text-(--color-stencil) max-w-md mx-auto">
              Esta área é reservada ao Alto Comando do CMF. Solicite ao comando que adicione seu
              cargo Discord à lista <code>DISCORD_ALTO_COMANDO_ROLE_IDS</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        tag={cfg.tag}
        title={cfg.title}
        sub={cfg.subtitle}
        action={
          temAcaoHeader ? (
            <button
              type="button"
              className="btn-olive text-xs disabled:opacity-50"
              disabled={actionLoading || saving}
              onClick={() => void handlePrimaryAction()}
            >
              ▸ {actionLoading ? "Processando…" : labelAcao}
            </button>
          ) : undefined
        }
      />

      {temFormulario && labelAcao && (
        <AdminModuleFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          view={view}
          title={labelAcao}
          saving={saving}
          onSubmit={(v, pdf) => void handleFormSubmit(v, pdf)}
        />
      )}

      {cfg.classified && (
        <div className="mb-4 flex items-center gap-2">
          <span className="tag-rank bg-(--color-destructive) text-[10px]">CLASSIFICADO</span>
          <span className="text-xs font-mono text-(--color-stencil)">
            Acesso restrito ao alto comando
          </span>
        </div>
      )}

      {loading && (
        <p className="text-xs font-mono text-(--color-stencil) mb-4 stencil">
          CARREGANDO REGISTROS…
        </p>
      )}

      {stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {stats.map((s) => (
            <Card key={s.label} className="field-paper border-0 shadow-none">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle
                  className="stencil text-[10px]"
                  style={{ color: s.color ?? "var(--color-olive-deep)" }}
                >
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="font-display text-3xl" style={{ color: s.color }}>
                  {s.value}
                </div>
                {s.sub && <p className="text-xs text-(--color-stencil) mt-0.5">{s.sub}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {cfg.variant === "discord" && view === "discord-bot" && (
        <DiscordBotPanel
          accessKey={accessKey}
          online={extra.online !== false}
          latencia={Number(extra.latencia_ms ?? 0)}
          uptime={String(extra.uptime_pct ?? "—")}
          onRefresh={reload}
        />
      )}
      {cfg.variant === "entrevistas" && <EntrevistasPanel rows={rows} loading={loading} />}

      {(cfg.variant === "table" ||
        cfg.variant === "logs" ||
        cfg.variant === "comunicacao" ||
        cfg.variant === "system" ||
        cfg.variant === "discord") &&
        cfg.columns.length > 0 && (
          <Card className="field-paper border-0 shadow-none">
            <CardHeader className="pb-2 flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle className="stencil text-xs">REGISTROS OPERACIONAIS</CardTitle>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar registros…"
                className="max-w-xs font-mono text-sm bg-transparent h-8"
              />
            </CardHeader>
            <CardContent className="pt-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-(--color-border) hover:bg-transparent">
                    {cfg.columns.map((col) => (
                      <TableHead key={col.key} className="stencil text-[10px]">
                        {col.label}
                      </TableHead>
                    ))}
                    {supportsPdf && <TableHead className="stencil text-[10px]">AÇÕES</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row, i) => {
                    const recordId = (row as Record<string, string>).__id;
                    const pdfPath = (row as Record<string, string>).__pdf_path;
                    return (
                      <TableRow key={i} className="border-(--color-border)">
                        {cfg.columns.map((col) => (
                          <TableCell
                            key={col.key}
                            className={`text-sm ${col.mono ? "font-mono text-xs" : ""}`}
                          >
                            {statusBadge(col.key, row[col.key]) ?? row[col.key]}
                          </TableCell>
                        ))}
                        {supportsPdf && (
                          <TableCell className="text-xs">
                            <div className="flex gap-2">
                              {pdfPath && recordId ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn-ghost-olive text-[10px] px-2 py-1"
                                    onClick={() => void handleDownloadPdf(recordId)}
                                  >
                                    ▾ Baixar
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-ghost-olive text-[10px] px-2 py-1 text-(--color-destructive)"
                                    onClick={() => void handleDeletePdf(recordId)}
                                  >
                                    ✕ Remover
                                  </button>
                                </>
                              ) : (
                                <span className="text-(--color-stencil)">sem PDF</span>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {!loading && filtered.length === 0 && (
                <p className="text-center text-xs text-(--color-stencil) py-8 stencil">
                  NENHUM REGISTRO — use o botão no topo para cadastrar
                </p>
              )}
            </CardContent>
          </Card>
        )}
    </div>
  );
}

function usesDb(view: AdminView): boolean {
  return (
    view in MODULO_DB ||
    view === "sys-db" ||
    view === "sys-api" ||
    view === "sys-seguranca" ||
    view === "discord-bot"
  );
}

function statusBadge(key: string, value: string) {
  if (key !== "status" && key !== "resultado" && key !== "nivel" && key !== "risco") return null;
  const v = value.toLowerCase();
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  if (
    v.includes("ativo") ||
    v.includes("sucesso") ||
    v.includes("apto") ||
    v.includes("online") ||
    v.includes("sincronizado") ||
    v.includes("operacional") ||
    v.includes("disponível")
  ) {
    variant = "default";
  } else if (
    v.includes("alto") ||
    v.includes("reprov") ||
    v.includes("inapto") ||
    v.includes("expuls")
  ) {
    variant = "destructive";
  } else if (
    v.includes("análise") ||
    v.includes("médio") ||
    v.includes("amarelo") ||
    v.includes("preparação")
  ) {
    variant = "secondary";
  }
  return (
    <Badge variant={variant} className="font-display tracking-widest text-[10px]">
      {value}
    </Badge>
  );
}

function DiscordBotPanel({
  accessKey,
  online,
  latencia,
  uptime,
  onRefresh,
}: {
  accessKey: string;
  online: boolean;
  latencia: number;
  uptime: string;
  onRefresh: () => void;
}) {
  const refreshBot = useServerFn(atualizarStatusDiscordBot);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshBot({ data: { accessKey, session: getDiscordSessionToken() } });
      toast.success("Status do bot atualizado");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="field-paper border-0 shadow-none mb-6">
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span
              className={`size-3 rounded-full shadow-[0_0_8px_lime] ${online ? "bg-green-500" : "bg-red-500"}`}
            />
            <div>
              <div className="font-display tracking-widest">
                BOT CMF — {online ? "ONLINE" : "OFFLINE"}
              </div>
              <p className="text-xs text-(--color-stencil)">Status em discord_bot_status</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-olive text-xs disabled:opacity-50"
            disabled={loading}
            onClick={() => void handleRefresh()}
          >
            {loading ? "Atualizando…" : "↻ Atualizar status"}
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm font-mono">
          <div className="p-3 border border-(--color-border)">
            <div className="stencil text-[10px] mb-1">LATÊNCIA</div>
            <div>{latencia} ms</div>
          </div>
          <div className="p-3 border border-(--color-border)">
            <div className="stencil text-[10px] mb-1">UPTIME</div>
            <div>{uptime}</div>
          </div>
          <div className="p-3 border border-(--color-border)">
            <div className="stencil text-[10px] mb-1">FONTE</div>
            <div>Supabase</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EntrevistasPanel({
  rows,
  loading,
}: {
  rows: Record<string, string>[];
  loading: boolean;
}) {
  if (loading) return null;

  const slots =
    rows.length > 0
      ? rows.map((r) => ({
          hora: r.data?.split(" ")[1] ?? r.data ?? "—",
          candidato: r.candidato ?? "—",
          instrutor: r.instrutor ?? "—",
          status: r.status ?? "Pendente",
        }))
      : [];

  return (
    <Card className="field-paper border-0 shadow-none mb-6">
      <CardHeader>
        <CardTitle className="stencil text-xs">AGENDA — ENTREVISTAS</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {slots.length === 0 ? (
          <p className="text-xs text-(--color-stencil)">
            Nenhuma entrevista — use &quot;Agendar entrevista&quot; acima para cadastrar.
          </p>
        ) : (
          slots.map((s) => (
            <div
              key={s.hora + s.candidato}
              className="flex flex-wrap items-center gap-3 p-3 border border-(--color-border)"
            >
              <span className="font-mono text-sm w-14">{s.hora}</span>
              <div className="flex-1 min-w-32">
                <div className="font-display tracking-wide">{s.candidato}</div>
                <p className="text-xs text-(--color-stencil)">{s.instrutor}</p>
              </div>
              <Badge
                variant={s.status === "Confirmada" ? "default" : "outline"}
                className="text-[10px]"
              >
                {s.status}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
