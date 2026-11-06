import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const STATUS_COR: Record<RelatorioPatrulha["status"], string> = {
  enviado: "bg-yellow-600",
  aprovado: "bg-green-700",
  devolvido: "bg-(--color-destructive)",
};

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
        <Card className="field-paper border-0 shadow-none">
          <CardContent className="py-10 text-center">
            <p className="font-display tracking-widest text-(--color-olive-deep)">Acesso negado</p>
            <p className="text-xs font-mono text-(--color-stencil)">
              Área da Polícia do Exército. Peça ao comando o cargo da PE no Discord.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <Card className="field-paper border-0 shadow-none">
        <CardContent className="pt-6">
          <form onSubmit={onEnviar} className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-mono">
              Data
              <Input type="date" required max={hoje()} {...campo("data")} />
            </label>
            <label className="text-xs font-mono">
              Início
              <Input type="time" required {...campo("inicio")} />
            </label>
            <label className="text-xs font-mono">
              Fim
              <Input type="time" required {...campo("fim")} />
            </label>
            <label className="text-xs font-mono">
              Viatura / prefixo
              <Input required maxLength={60} placeholder="VTR PE-01" {...campo("viatura")} />
            </label>
            <label className="text-xs font-mono sm:col-span-2">
              Área ou rota
              <Input
                required
                maxLength={120}
                placeholder="Centro, Rodovia Norte…"
                {...campo("area")}
              />
            </label>
            <label className="text-xs font-mono sm:col-span-3">
              Equipe
              <Input
                required
                maxLength={500}
                placeholder="Nomes dos militares, separados por vírgula"
                {...campo("equipe")}
              />
            </label>
            <label className="text-xs font-mono">
              Abordagens
              <Input type="number" min={0} max={999} required {...campo("abordagens")} />
            </label>
            <label className="text-xs font-mono">
              Prisões
              <Input type="number" min={0} max={999} required {...campo("prisoes")} />
            </label>
            <label className="text-xs font-mono">
              Apreensões
              <Input type="number" min={0} max={999} required {...campo("apreensoes")} />
            </label>
            <label className="text-xs font-mono sm:col-span-3">
              Ocorrências
              <Textarea maxLength={3000} rows={3} {...campo("ocorrencias")} />
            </label>
            <label className="text-xs font-mono sm:col-span-3">
              Observações
              <Textarea maxLength={2000} rows={2} {...campo("observacoes")} />
            </label>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={enviando}>
                {enviando ? "Enviando…" : "Enviar relatório"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-xs font-mono">
          {permissao.comando ? "Militar, equipe ou área" : "Equipe ou área"}
          <Input
            value={filtro.busca}
            maxLength={60}
            onChange={(e) => setFiltro((f) => ({ ...f, busca: e.target.value }))}
          />
        </label>
        <label className="text-xs font-mono">
          De
          <Input
            type="date"
            value={filtro.desde}
            onChange={(e) => setFiltro((f) => ({ ...f, desde: e.target.value }))}
          />
        </label>
        <label className="text-xs font-mono">
          Até
          <Input
            type="date"
            value={filtro.ate}
            onChange={(e) => setFiltro((f) => ({ ...f, ate: e.target.value }))}
          />
        </label>
        <label className="text-xs font-mono">
          Situação
          <select
            className="block h-9 border px-2 bg-transparent"
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
        <p className="text-sm text-(--color-stencil) font-mono">Nenhum relatório encontrado.</p>
      )}
      {relatorios.map((r) => (
        <Card key={r.id} className="field-paper border-0 shadow-none">
          <CardContent className="pt-6 space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={STATUS_COR[r.status]}>{r.status.toUpperCase()}</Badge>
              <span className="font-mono">
                {r.data.split("-").reverse().join("/")} · {r.inicio.slice(0, 5)}–{r.fim.slice(0, 5)}
              </span>
              <span className="font-display">{r.autor_nome}</span>
              <span className="text-(--color-stencil)">
                · {r.viatura} · {r.area}
              </span>
            </div>
            <p>
              <span className="stencil text-[10px]">EQUIPE </span>
              {r.equipe}
            </p>
            <p className="font-mono text-xs">
              Abordagens {r.abordagens} · Prisões {r.prisoes} · Apreensões {r.apreensoes}
            </p>
            {r.ocorrencias && <p className="whitespace-pre-wrap">{r.ocorrencias}</p>}
            {r.observacoes && (
              <p className="whitespace-pre-wrap text-(--color-stencil)">{r.observacoes}</p>
            )}
            {r.parecer && (
              <p className="text-xs border-l-2 pl-2">
                <span className="stencil text-[10px]">PARECER </span>
                {r.parecer} {r.revisado_por && <span>— {r.revisado_por}</span>}
              </p>
            )}
            {permissao.comando && r.status === "enviado" && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => void onDecidir(r.id, "aprovado")}>
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void onDecidir(r.id, "devolvido")}
                >
                  Devolver
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
