import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Check, Lock, Send, Undo2 } from "lucide-react";
import { StatusBadge, type Tom } from "@/components/admin/panel-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  acessoPatrulha,
  decidirRelatorioPatrulha,
  enviarRelatorioPatrulha,
  listarRelatoriosPatrulha,
  type RelatorioPatrulha,
} from "@/lib/patrulha.functions";
import { getDiscordSessionToken } from "@/lib/painel-auth-storage";

const STATUS_VISUAL: Record<RelatorioPatrulha["status"], { tom: Tom; label: string }> = {
  enviado: { tom: "alerta", label: "Aguardando" },
  aprovado: { tom: "ok", label: "Aprovado" },
  devolvido: { tom: "perigo", label: "Devolvido" },
};

/** Rótulo mono em cima, campo na fonte normal. */
const LBL =
  "flex flex-col gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground [&_:is(input,textarea,select)]:font-body [&_:is(input,textarea,select)]:normal-case [&_:is(input,textarea,select)]:tracking-normal [&_:is(input,textarea,select)]:text-sm [&_:is(input,textarea,select)]:text-foreground [&_:is(input,textarea,select)]:bg-background";

const hoje = () => new Date().toLocaleDateString("sv-SE");
const VAZIO = {
  data: hoje(),
  inicio: "",
  fim: "",
  viatura: "",
  equipe: "",
  area: "",
  abordagens: "0",
  prisoes: "0",
  apreensoes: "0",
  ocorrencias: "",
  observacoes: "",
};

/** Relatório de patrulha da Polícia do Exército: a PE envia, o comando da PE aprova ou devolve. */
export function PatrulhaPE() {
  const acesso = useServerFn(acessoPatrulha);
  const enviar = useServerFn(enviarRelatorioPatrulha);
  const listar = useServerFn(listarRelatoriosPatrulha);
  const decidir = useServerFn(decidirRelatorioPatrulha);

  const [permissao, setPermissao] = useState<{ pe: boolean; comando: boolean } | null>(null);
  const [form, setForm] = useState(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [relatorios, setRelatorios] = useState<RelatorioPatrulha[]>([]);
  const [filtro, setFiltro] = useState({ busca: "", desde: "", ate: "", status: "" });

  const carregar = useCallback(async () => {
    try {
      const r = await listar({
        data: {
          session: getDiscordSessionToken(),
          busca: filtro.busca || undefined,
          desde: filtro.desde || undefined,
          ate: filtro.ate || undefined,
          status: (filtro.status || undefined) as RelatorioPatrulha["status"] | undefined,
        },
      });
      setRelatorios(r.relatorios);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar relatórios");
    }
  }, [listar, filtro]);

  useEffect(() => {
    acesso({ data: { session: getDiscordSessionToken() } })
      .then(setPermissao)
      .catch(() => setPermissao({ pe: false, comando: false }));
  }, [acesso]);

  useEffect(() => {
    if (permissao?.pe) void carregar();
  }, [permissao, carregar]);

  const campo = (k: keyof typeof VAZIO) => ({
    value: form[k],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  async function onEnviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await enviar({
        data: {
          session: getDiscordSessionToken(),
          relatorio: {
            ...form,
            abordagens: Number(form.abordagens),
            prisoes: Number(form.prisoes),
            apreensoes: Number(form.apreensoes),
          },
        },
      });
      toast.success("Relatório enviado ao comando da PE.");
      setForm({ ...VAZIO, data: hoje() });
      void carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar relatório");
    } finally {
      setEnviando(false);
    }
  }

  async function onDecidir(id: string, status: "aprovado" | "devolvido") {
    const parecer =
      status === "devolvido"
        ? window.prompt("Motivo da devolução (o patrulheiro verá este texto):")?.trim()
        : undefined;
    if (status === "devolvido" && !parecer) return;
    try {
      await decidir({ data: { session: getDiscordSessionToken(), id, status, parecer } });
      toast.success(status === "aprovado" ? "Relatório aprovado." : "Relatório devolvido.");
      void carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao registrar decisão");
    }
  }

  const header = (
    <AdminPageHeader
      tag="POLÍCIA DO EXÉRCITO"
      title="Relatórios de patrulha"
      sub="Registro de cada patrulha da PE, revisado pelo comando."
    />
  );

  if (!permissao) return header;
  if (!permissao.pe) {
    return (
      <div>
        {header}
        <div className="mx-auto mt-10 max-w-115 flex flex-col items-center gap-4 border border-border bg-card p-10 text-center">
          <span className="size-16 flex items-center justify-center border border-(--color-gold)">
            <Lock className="size-7 text-(--color-gold)" />
          </span>
          <span className="font-mono text-xs tracking-[0.14em] text-(--color-gold)">ACESSO NEGADO</span>
          <p className="font-display text-[26px] font-semibold">Área da Polícia do Exército.</p>
          <p className="text-[15px] text-muted-foreground">Peça ao comando o cargo da PE no Discord.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <Card className="field-paper border-0 shadow-none">
        <CardContent className="pt-6">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Novo relatório</div>
          <form onSubmit={onEnviar} className="grid gap-4 sm:grid-cols-3">
            <label className={`${LBL}`}>
              Data
              <Input type="date" required max={hoje()} {...campo("data")} />
            </label>
            <label className={`${LBL}`}>
              Início
              <Input type="time" required {...campo("inicio")} />
            </label>
            <label className={`${LBL}`}>
              Fim
              <Input type="time" required {...campo("fim")} />
            </label>
            <label className={`${LBL}`}>
              Viatura / prefixo
              <Input required maxLength={60} placeholder="VTR PE-01" {...campo("viatura")} />
            </label>
            <label className={`${LBL} sm:col-span-2`}>
              Área ou rota
              <Input
                required
                maxLength={120}
                placeholder="Centro, Rodovia Norte…"
                {...campo("area")}
              />
            </label>
            <label className={`${LBL} sm:col-span-3`}>
              Equipe
              <Input
                required
                maxLength={500}
                placeholder="Nomes dos militares, separados por vírgula"
                {...campo("equipe")}
              />
            </label>
            <label className={`${LBL}`}>
              Abordagens
              <Input type="number" min={0} max={999} required {...campo("abordagens")} />
            </label>
            <label className={`${LBL}`}>
              Prisões
              <Input type="number" min={0} max={999} required {...campo("prisoes")} />
            </label>
            <label className={`${LBL}`}>
              Apreensões
              <Input type="number" min={0} max={999} required {...campo("apreensoes")} />
            </label>
            <label className={`${LBL} sm:col-span-3`}>
              Ocorrências
              <Textarea maxLength={3000} rows={3} {...campo("ocorrencias")} />
            </label>
            <label className={`${LBL} sm:col-span-3`}>
              Observações
              <Textarea maxLength={2000} rows={2} {...campo("observacoes")} />
            </label>
            <div className="sm:col-span-3 flex justify-end">
              <button type="submit" disabled={enviando} className="btn-olive inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50">
                <Send className="size-4" /> {enviando ? "ENVIANDO…" : "ENVIAR RELATÓRIO"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 items-end">
        <label className={`${LBL}`}>
          {permissao.comando ? "Militar, equipe ou área" : "Equipe ou área"}
          <Input
            value={filtro.busca}
            maxLength={60}
            onChange={(e) => setFiltro((f) => ({ ...f, busca: e.target.value }))}
          />
        </label>
        <label className={`${LBL}`}>
          De
          <Input
            type="date"
            value={filtro.desde}
            onChange={(e) => setFiltro((f) => ({ ...f, desde: e.target.value }))}
          />
        </label>
        <label className={`${LBL}`}>
          Até
          <Input
            type="date"
            value={filtro.ate}
            onChange={(e) => setFiltro((f) => ({ ...f, ate: e.target.value }))}
          />
        </label>
        <label className={`${LBL}`}>
          Situação
          <select
            className="block h-9 border border-input px-2"
            value={filtro.status}
            onChange={(e) => setFiltro((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">Todas</option>
            <option value="enviado">Aguardando</option>
            <option value="aprovado">Aprovados</option>
            <option value="devolvido">Devolvidos</option>
          </select>
        </label>
      </div>

      {relatorios.length === 0 && (
        <p className="py-8 text-center font-mono text-xs text-muted-foreground">NENHUM RELATÓRIO ENCONTRADO</p>
      )}
      {relatorios.map((r) => (
        <Card key={r.id} className={`field-paper border-0 shadow-none ${r.status === "enviado" && permissao.comando ? "border-l-3! border-l-(--color-olive-bright)!" : ""}`}>
          <CardContent className="pt-6 space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tom={STATUS_VISUAL[r.status].tom}>{STATUS_VISUAL[r.status].label}</StatusBadge>
              <span className="font-display text-lg">
                {r.data.split("-").reverse().join("/")} · {r.inicio.slice(0, 5)}–{r.fim.slice(0, 5)}
              </span>
              <span className="text-foreground">{r.autor_nome}</span>
              <span className="text-muted-foreground">
                · {r.viatura} · {r.area}
              </span>
            </div>
            <p>
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">EQUIPE </span>
              {r.equipe}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              Abordagens {r.abordagens} · Prisões {r.prisoes} · Apreensões {r.apreensoes}
            </p>
            {r.ocorrencias && <p className="whitespace-pre-wrap">{r.ocorrencias}</p>}
            {r.observacoes && (
              <p className="whitespace-pre-wrap text-muted-foreground">{r.observacoes}</p>
            )}
            {r.parecer && (
              <p className="text-[13px] border-l-2 border-(--color-destructive)/60 pl-2.5 text-[#e8a58c]">
                <span className="font-mono text-[10px] tracking-[0.14em]">PARECER </span>
                {r.parecer} {r.revisado_por && <span>— {r.revisado_por}</span>}
              </p>
            )}
            {permissao.comando && r.status === "enviado" && (
              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 border border-(--color-destructive) px-4 py-2 font-display text-sm tracking-[0.1em] text-(--color-destructive) hover:bg-(--color-destructive)/10"
                  onClick={() => void onDecidir(r.id, "devolvido")}
                >
                  <Undo2 className="size-4" /> DEVOLVER
                </button>
                <button
                  type="button"
                  className="btn-olive inline-flex items-center gap-2 px-4 py-2 text-sm"
                  onClick={() => void onDecidir(r.id, "aprovado")}
                >
                  <Check className="size-4" /> APROVAR
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
