import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import type { AdminView } from "@/config/admin-nav";
import { papelDaView } from "@/config/admin-nav";
import { papelAlcanca } from "@/lib/access-control";
import { getLabelAcao, getModuloForm } from "@/config/admin-module-forms";
import { MODULO_DB, PDF_RESTRITO_VIEWS } from "@/config/admin-modules-db";
import {
  AdminModuleFormDialog,
  type AdminFormPdf,
} from "@/components/admin/AdminModuleFormDialog";
import { Download, Lock, Plus, Search, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Kpi, StatusBadge, type Tom } from "@/components/admin/panel-ui";
import { getModuleConfig, type ModuleStat } from "@/components/admin/module-registry";
import {
  atualizarStatusDiscordBot,
  baixarPdfRestrito,
  carregarModuloAdmin,
  criarRegistroModulo,
  definirAltoComando,
  removerPdfRestrito,
  uploadPdfRestrito,
} from "@/lib/admin-modules.functions";
import { useDiscordSession } from "@/hooks/useDiscordSession";
import { getDiscordSessionToken } from "@/lib/painel-auth-storage";
import { Button } from "@/components/ui/button";
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

export function AdminModuleView({ view }: { view: AdminView }) {
  const cfg = getModuleConfig(view);
  const { papel, loading: verificandoPapel, erro: erroSessao } = useDiscordSession();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState(cfg.rows);
  const [stats, setStats] = useState<ModuleStat[]>(cfg.stats);
  const [extra, setExtra] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(usesDb(view));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadModulo = useServerFn(carregarModuloAdmin);
  const criarRegistro = useServerFn(criarRegistroModulo);
  const uploadPdf = useServerFn(uploadPdfRestrito);
  const downloadPdf = useServerFn(baixarPdfRestrito);
  const deletePdf = useServerFn(removerPdfRestrito);
  const salvarAltoComando = useServerFn(definirAltoComando);

  const acessoNegado =
    !verificandoPapel && (erroSessao !== null || !papelAlcanca(papel, papelDaView(view)));
  const supportsPdf = PDF_RESTRITO_VIEWS.has(view);
  const podeDarAltoComando = view === "efetivo-ativos" && papel === "desenvolvedor";

  const alternarAltoComando = async (militarId: string, ativo: boolean) => {
    try {
      await salvarAltoComando({ data: { session: getDiscordSessionToken(), militarId, ativo } });
      setRows((atual) =>
        atual.map((r) => (r.__id === militarId ? { ...r, __alto: ativo ? "1" : "" } : r)),
      );
      toast.success(ativo ? "Alto Comando concedido" : "Alto Comando retirado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar a tag");
    }
  };

  const reload = useCallback(() => {
    if (!usesDb(view)) return;
    if (verificandoPapel || acessoNegado) return;
    setLoading(true);
    loadModulo({ data: { view, session: getDiscordSessionToken() } })
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
  }, [view, loadModulo, acessoNegado, verificandoPapel]);

  useEffect(() => {
    if (!usesDb(view)) {
      setRows(cfg.rows);
      setStats(cfg.stats);
      setLoading(false);
      return;
    }
    reload();
  }, [view, reload, cfg.rows, cfg.stats]);

  const filtered = rows.filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return Object.values(row).some((v) => v.toLowerCase().includes(q));
  });

  const temFormulario = !!getModuloForm(view);
  const labelAcao = getLabelAcao(view, cfg.primaryAction);
  const temAcaoHeader = !!(
    labelAcao &&
    cfg.variant !== "defcon" &&
    (temFormulario || view === "sys-db")
  );

  const handlePrimaryAction = async () => {
    if (view === "sys-db") {
      reload();
      toast.success("Contagens atualizadas");
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
      const result = await criarRegistro({ data: { view, valores, session } });
      if (pdf) {
        if (!result.id) {
          toast.error("Registro criado, mas não foi possível anexar o PDF (ID ausente).");
        } else if (!session) {
          toast.error("Sessão Discord necessária para anexar PDF.");
        } else {
          await uploadPdf({
            data: {
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
        data: { session, recordId },
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
      await deletePdf({ data: { session, recordId } });
      toast.success("PDF removido");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao remover PDF");
    }
  };

  if (erroSessao) {
    return (
      <div>
        <AdminPageHeader tag={cfg.tag} title={cfg.title} sub={cfg.subtitle} />
        <ErroVerificacao mensagem={erroSessao} />
      </div>
    );
  }

  if (acessoNegado) {
    return (
      <div>
        <AdminPageHeader tag={cfg.tag} title={cfg.title} sub={cfg.subtitle} />
        <div className="mx-auto mt-10 max-w-115 flex flex-col items-center gap-4 border border-border bg-card p-10 text-center">
          <span className="size-16 flex items-center justify-center border border-(--color-gold)">
            <Lock className="size-7 text-(--color-gold)" />
          </span>
          <span className="font-mono text-xs tracking-[0.14em] text-(--color-gold)">ACESSO NEGADO</span>
          <p className="font-display text-[26px] font-semibold">Esta área é do Alto Comando.</p>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            O seu cargo no Discord não libera esta área. Se você acha que deveria ter acesso, fale com o
            Alto Comando.
          </p>
        </div>
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
              className="btn-olive inline-flex items-center gap-2 px-4.5 py-2.5 text-sm disabled:opacity-50"
              disabled={saving}
              onClick={() => void handlePrimaryAction()}
            >
              <Plus className="size-4" /> {labelAcao}
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
        <div className="mb-4 flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-(--color-gold)">
          <Lock className="size-3.5" /> CLASSIFICADO · ACESSO RESTRITO
        </div>
      )}

      {loading && (
        <p className="font-mono text-xs text-muted-foreground mb-4">
          CARREGANDO REGISTROS…
        </p>
      )}

      {stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((s) => (
            <Kpi key={s.label} label={s.label} value={s.value} sub={s.sub} />
          ))}
        </div>
      )}

      {cfg.variant === "discord" && view === "discord-bot" && (
        <DiscordBotPanel
          online={extra.online !== false}
          latencia={Number(extra.latencia_ms ?? 0)}
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
          <div className="flex flex-col gap-4">
            <div className="relative w-full sm:w-85">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar…"
                className="h-10 pl-9 bg-card"
              />
            </div>
            <div className="border border-border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    {cfg.columns.map((col) => (
                      <TableHead key={col.key} className="h-11 px-5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {col.label}
                      </TableHead>
                    ))}
                    {supportsPdf && <TableHead className="h-11 px-5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">AÇÕES</TableHead>}
                    {podeDarAltoComando && (
                      <TableHead className="h-11 px-5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">ALTO COMANDO</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row, i) => {
                    const recordId = (row as Record<string, string>).__id;
                    const pdfPath = (row as Record<string, string>).__pdf_path;
                    return (
                      <TableRow key={i} className="border-border">
                        {cfg.columns.map((col) => (
                          <TableCell
                            key={col.key}
                            className={`px-5 py-3.5 text-sm ${col.mono ? "font-mono text-xs tracking-wider text-(--color-olive-bright)" : ""}`}
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
                                    className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => void handleDownloadPdf(recordId)}
                                  >
                                    <Download className="size-3.5" /> Baixar
                                  </button>
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-xs text-(--color-destructive) hover:bg-secondary"
                                    onClick={() => void handleDeletePdf(recordId)}
                                  >
                                    <X className="size-3.5" /> Remover
                                  </button>
                                </>
                              ) : (
                                <span className="text-muted-foreground">sem PDF</span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {podeDarAltoComando && (
                          <TableCell className="text-xs">
                            {!row.__discord ? (
                              <span className="text-(--color-stencil)">sem Discord</span>
                            ) : (
                              <button
                                type="button"
                                className={`btn-ghost-olive text-[10px] px-2 py-1 ${row.__alto ? "text-(--color-destructive)" : ""}`}
                                onClick={() => void alternarAltoComando(recordId, !row.__alto)}
                              >
                                {row.__alto ? "✕ Retirar" : "★ Conceder"}
                              </button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {!loading && filtered.length === 0 && (
                <p className="text-center font-mono text-xs text-muted-foreground py-10">
                  NENHUM REGISTRO — use o botão no topo para cadastrar
                </p>
              )}
            </div>
          </div>
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

const CHAVES_STATUS = new Set(["status", "resultado", "nivel", "risco", "grau", "classificacao", "auto", "tipo"]);

function statusBadge(key: string, value: string) {
  if (!CHAVES_STATUS.has(key) || !value || value === "—") return null;
  const v = value.toLowerCase();
  let tom: Tom = "neutro";
  if (/ativ|sucesso|apto|online|sincroniz|operacional|disponível|conclu|^sim|baixo|leve|aprov/.test(v)) tom = "ok";
  if (/análise|analise|em curso|secreto|confidencial/.test(v)) tom = "info";
  if (/médio|medio|média|amarelo|preparação|pend|agend|andamento|parcial|aberto/.test(v)) tom = "alerta";
  if (/alto|reprov|inapto|expuls|grave|ultra|falh|encerr|inativ|^não/.test(v)) tom = "perigo";
  return <StatusBadge tom={tom}>{value}</StatusBadge>;
}

function DiscordBotPanel({
  online,
  latencia,
  onRefresh,
}: {
  online: boolean;
  latencia: number;
  onRefresh: () => void;
}) {
  const refreshBot = useServerFn(atualizarStatusDiscordBot);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshBot({ data: { session: getDiscordSessionToken() } });
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
                BOT 2ª DE — {online ? "ONLINE" : "OFFLINE"}
              </div>
              <p className="text-xs text-(--color-stencil)">Consulta o bot no Discord ao atualizar</p>
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
        <div className="grid sm:grid-cols-2 gap-3 text-sm font-mono">
          <div className="p-3 border border-(--color-border)">
            <div className="stencil text-[10px] mb-1">LATÊNCIA</div>
            <div>{latencia} ms</div>
          </div>
          <div className="p-3 border border-(--color-border)">
            <div className="stencil text-[10px] mb-1">FONTE</div>
            <div>API do Discord</div>
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

/** O cargo não pôde ser conferido (Discord ou banco fora): não é "acesso negado". */
export function ErroVerificacao({ mensagem }: { mensagem: string }) {
  return (
    <Card className="field-paper border-0 shadow-none">
      <CardContent className="py-10 text-center space-y-3">
        <p className="font-display tracking-widest text-(--color-olive-deep)">
          Não foi possível verificar seu cargo
        </p>
        <p className="text-xs font-mono text-(--color-stencil) max-w-md mx-auto">{mensagem}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
          Tentar de novo
        </Button>
      </CardContent>
    </Card>
  );
}
