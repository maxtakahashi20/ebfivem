import type { AdminView } from "@/config/admin-nav";
import { getPlaceholderMeta } from "@/config/admin-nav";

export type ModuleVariant =
  | "table"
  | "defcon"
  | "discord"
  | "logs"
  | "system"
  | "entrevistas"
  | "comunicacao";

export type ModuleStat = {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
};

export type ModuleColumn = { key: string; label: string; mono?: boolean };

export type ModuleRow = Record<string, string>;

export type ModuleConfig = {
  tag: string;
  title: string;
  subtitle: string;
  variant?: ModuleVariant;
  stats: ModuleStat[];
  columns: ModuleColumn[];
  rows: ModuleRow[];
  primaryAction?: string;
  classified?: boolean;
};

const C = {
  green: "oklch(0.50 0.13 145)",
  olive: "oklch(0.40 0.07 132)",
  yellow: "oklch(0.72 0.13 80)",
  blue: "oklch(0.55 0.12 230)",
  red: "oklch(0.48 0.18 30)",
};

function base(
  view: AdminView,
  extra: Partial<ModuleConfig> & Pick<ModuleConfig, "stats" | "columns" | "rows">,
): ModuleConfig {
  const meta = getPlaceholderMeta(view);
  return {
    tag: meta.tag ?? "COMANDO",
    title: meta.title,
    subtitle: meta.desc,
    variant: "table",
    ...extra,
  };
}

const REGISTRY: Partial<Record<AdminView, ModuleConfig>> = {
  "recrutamento-entrevistas": {
    tag: "RECRUTAMENTO",
    title: "Entrevistas",
    subtitle: "Agenda e controle de entrevistas com recrutas.",
    variant: "entrevistas",
    stats: [
      { label: "Agendadas", value: 8, sub: "esta semana", color: C.blue },
      { label: "Realizadas", value: 24, sub: "últimos 30 dias", color: C.green },
      { label: "Pendentes confirmação", value: 3, color: C.yellow },
    ],
    columns: [],
    rows: [],
    primaryAction: "Agendar entrevista",
  },

  "ops-ativas": base("ops-ativas", {
    stats: [
      { label: "Em curso", value: 4, sub: "operações ativas", color: C.red },
      { label: "Efetivo mobilizado", value: 28, color: C.olive },
      { label: "Zonas cobertas", value: 6, color: C.blue },
    ],
    columns: [
      { key: "codigo", label: "CÓDIGO", mono: true },
      { key: "nome", label: "OPERAÇÃO" },
      { key: "lider", label: "COMANDANTE" },
      { key: "status", label: "STATUS" },
      { key: "inicio", label: "INÍCIO", mono: true },
    ],
    rows: [],
    primaryAction: "Nova operação",
  }),

  "intel-relatorios": base("intel-relatorios", {
    stats: [{ label: "Relatórios (30d)", value: 22, color: C.olive }],
    columns: [
      { key: "ref", label: "REF", mono: true },
      { key: "assunto", label: "ASSUNTO" },
      { key: "classificacao", label: "CLASS." },
      { key: "data", label: "DATA", mono: true },
    ],
    rows: [],
    primaryAction: "Novo relatório",
  }),

  "intel-investigacao": base("intel-investigacao", {
    stats: [
      { label: "Casos abertos", value: 5, color: C.blue },
      { label: "Encerrados (mês)", value: 8, color: C.green },
    ],
    primaryAction: "Abrir caso",
    columns: [
      { key: "caso", label: "CASO", mono: true },
      { key: "titulo", label: "TÍTULO" },
      { key: "responsavel", label: "S2" },
      { key: "status", label: "STATUS" },
    ],
    rows: [],
  }),

  "intel-suspeitos": base("intel-suspeitos", {
    stats: [{ label: "Monitorados", value: 17, color: C.yellow }],
    primaryAction: "Adicionar suspeito",
    columns: [
      { key: "cod", label: "COD", mono: true },
      { key: "alias", label: "ALIAS / NOME" },
      { key: "risco", label: "RISCO" },
      { key: "ultima", label: "ÚLTIMA AVIST.", mono: true },
    ],
    rows: [],
  }),

  "intel-blacklist": base("intel-blacklist", {
    stats: [{ label: "Registros", value: 34, color: C.red }],
    columns: [
      { key: "id", label: "ID", mono: true },
      { key: "nome", label: "IDENTIFICAÇÃO" },
      { key: "motivo", label: "MOTIVO" },
      { key: "desde", label: "DESDE", mono: true },
    ],
    rows: [],
    primaryAction: "Incluir na blacklist",
  }),

  "intel-sigilosos": base("intel-sigilosos", {
    classified: true,
    stats: [{ label: "Documentos", value: 9, color: C.red }],
    columns: [
      { key: "doc", label: "DOC", mono: true },
      { key: "titulo", label: "TÍTULO" },
      { key: "nivel", label: "NÍVEL" },
      { key: "acesso", label: "ACESSO" },
    ],
    rows: [],
  }),

  "efetivo-ativos": base("efetivo-ativos", {
    stats: [
      { label: "Militares", value: 0, color: C.green },
      { label: "Autenticados Discord", value: 0, color: C.blue },
    ],
    columns: [
      { key: "id", label: "ID", mono: true },
      { key: "nome", label: "NOME" },
      { key: "patente", label: "PATENTE" },
      { key: "discord", label: "DISCORD" },
      { key: "status", label: "STATUS" },
    ],
    rows: [],
  }),

  "efetivo-instrutores": base("efetivo-instrutores", {
    stats: [{ label: "Instrutores", value: 0, color: C.blue }],
    columns: [
      { key: "nome", label: "NOME" },
      { key: "modulos", label: "MÓDULOS" },
      { key: "carga", label: "CARGA SEM." },
    ],
    rows: [],
  }),

  "logs-geral": base("logs-geral", {
    variant: "logs",
    stats: [{ label: "Eventos (24h)", value: 0, color: C.olive }],
    columns: [
      { key: "hora", label: "HORA", mono: true },
      { key: "tipo", label: "TIPO" },
      { key: "usuario", label: "OPERADOR" },
      { key: "acao", label: "AÇÃO" },
      { key: "detalhe", label: "DETALHE" },
    ],
    rows: [],
  }),

  "discord-webhooks": base("discord-webhooks", {
    variant: "discord",
    stats: [{ label: "Webhooks", value: 2, color: C.green }],
    primaryAction: "Novo webhook",
    columns: [
      { key: "nome", label: "CANAL" },
      { key: "uso", label: "USO" },
      { key: "status", label: "STATUS" },
    ],
    rows: [],
  }),

  "discord-bot": base("discord-bot", {
    variant: "discord",
    stats: [
      { label: "Latência", value: "42ms", color: C.green },
      { label: "Uptime", value: "99.8%", color: C.olive },
    ],
    columns: [],
    rows: [],
  }),

  "discord-cargos": base("discord-cargos", {
    variant: "discord",
    stats: [{ label: "Regras de sync", value: 0, color: C.blue }],
    primaryAction: "Nova regra de cargo",
    columns: [
      { key: "patente", label: "PATENTE RP" },
      { key: "cargo", label: "CARGO DISCORD" },
      { key: "auto", label: "AUTO" },
    ],
    rows: [],
  }),

  "discord-logs": base("discord-logs", {
    variant: "logs",
    stats: [{ label: "Mensagens log (24h)", value: 0, color: C.blue }],
    columns: [
      { key: "hora", label: "HORA", mono: true },
      { key: "evento", label: "EVENTO" },
    ],
    rows: [],
  }),

  "discord-sync": base("discord-sync", {
    variant: "discord",
    stats: [
      { label: "Última sync", value: "—", color: C.green },
      { label: "Pendentes", value: 0, color: C.olive },
    ],
    columns: [
      { key: "item", label: "ITEM" },
      { key: "status", label: "STATUS" },
    ],
    rows: [],
    primaryAction: "Sincronizar agora",
  }),

  "sys-db": base("sys-db", {
    variant: "system",
    stats: [
      { label: "Status", value: "Online", color: C.green },
      { label: "Latência", value: "28ms", color: C.blue },
    ],
    primaryAction: "Atualizar contagens",
    columns: [
      { key: "tabela", label: "TABELA" },
      { key: "registros", label: "REGISTROS" },
      { key: "ultimo", label: "ÚLTIMO BACKUP", mono: true },
    ],
    rows: [],
  }),

  "sys-api": base("sys-api", {
    variant: "system",
    stats: [{ label: "Endpoints", value: 12, color: C.olive }],
    columns: [
      { key: "rota", label: "ROTA", mono: true },
      { key: "metodo", label: "MÉTODO" },
      { key: "status", label: "STATUS" },
    ],
    rows: [],
  }),

  "sys-seguranca": base("sys-seguranca", {
    variant: "system",
    stats: [{ label: "Nível", value: "Alto", color: C.green }],
    columns: [
      { key: "item", label: "CONTROLE" },
      { key: "status", label: "STATUS" },
    ],
    rows: [
      { item: "ACCESS_KEY painel", status: "Configurado" },
      { item: "RLS Supabase", status: "Ativo" },
      { item: "HTTPS", status: "Ativo" },
    ],
  }),

  "sys-sessoes": base("sys-sessoes", {
    variant: "system",
    stats: [{ label: "Sessões ativas", value: 1, color: C.blue }],
    primaryAction: "Registrar sessão",
    columns: [
      { key: "inicio", label: "INÍCIO", mono: true },
      { key: "ip", label: "ORIGEM" },
      { key: "status", label: "STATUS" },
    ],
    rows: [],
  }),

  "sys-backup": base("sys-backup", {
    variant: "system",
    stats: [
      { label: "Último backup", value: "—", color: C.green },
      { label: "Retenção", value: "30 dias", color: C.olive },
    ],
    columns: [
      { key: "id", label: "ID", mono: true },
      { key: "tipo", label: "TIPO" },
      { key: "tamanho", label: "TAMANHO" },
      { key: "data", label: "DATA", mono: true },
    ],
    rows: [],
    primaryAction: "Executar backup",
  }),

  "disc-advertencias": base("disc-advertencias", {
    stats: [{ label: "Advertências (mês)", value: 7, color: C.yellow }],
    columns: [
      { key: "militar", label: "MILITAR" },
      { key: "motivo", label: "MOTIVO" },
      { key: "grau", label: "GRAU" },
      { key: "data", label: "DATA", mono: true },
    ],
    rows: [],
    primaryAction: "Registrar advertência",
  }),

  "disc-prisoes": base("disc-prisoes", {
    stats: [{ label: "Detidos", value: 0, color: C.red }],
    primaryAction: "Registrar prisão",
    columns: [
      { key: "militar", label: "MILITAR" },
      { key: "motivo", label: "MOTIVO" },
      { key: "tempo", label: "TEMPO RP" },
    ],
    rows: [],
  }),

  "disc-suspensoes": base("disc-suspensoes", {
    stats: [{ label: "Suspensões ativas", value: 0, color: C.yellow }],
    primaryAction: "Registrar suspensão",
    columns: [
      { key: "militar", label: "MILITAR" },
      { key: "ate", label: "ATÉ", mono: true },
      { key: "motivo", label: "MOTIVO" },
    ],
    rows: [],
  }),

  "disc-expulsoes": base("disc-expulsoes", {
    stats: [{ label: "Expulsões (ano)", value: 0, color: C.red }],
    primaryAction: "Registrar expulsão",
    columns: [
      { key: "militar", label: "MILITAR" },
      { key: "motivo", label: "MOTIVO" },
      { key: "data", label: "DATA", mono: true },
    ],
    rows: [],
  }),

  "disc-sindicancias": base("disc-sindicancias", {
    stats: [{ label: "Processos abertos", value: 0, color: C.blue }],
    columns: [
      { key: "proc", label: "PROCESSO", mono: true },
      { key: "acusado", label: "ACUSADO" },
      { key: "status", label: "STATUS" },
    ],
    rows: [],
    primaryAction: "Abrir sindicância",
  }),

  "restrito-intel": base("restrito-intel", {
    classified: true,
    stats: [{ label: "Arquivos", value: 0, color: C.red }],
    primaryAction: "Novo documento",
    columns: [
      { key: "ref", label: "REF", mono: true },
      { key: "titulo", label: "TÍTULO" },
      { key: "nivel", label: "NÍVEL" },
      { key: "arquivo", label: "PDF" },
    ],
    rows: [],
  }),

  "restrito-ops": base("restrito-ops", {
    classified: true,
    stats: [{ label: "OPs classificadas", value: 0, color: C.red }],
    primaryAction: "Nova OP sigilosa",
    columns: [
      { key: "codigo", label: "CÓDIGO", mono: true },
      { key: "nome", label: "NOME" },
      { key: "acesso", label: "ACESSO" },
      { key: "arquivo", label: "PDF" },
    ],
    rows: [],
  }),

  "restrito-docs": base("restrito-docs", {
    classified: true,
    stats: [{ label: "Documentos", value: 0, color: C.red }],
    primaryAction: "Novo documento interno",
    columns: [
      { key: "doc", label: "DOC", mono: true },
      { key: "titulo", label: "TÍTULO" },
      { key: "custodia", label: "CUSTÓDIA" },
      { key: "arquivo", label: "PDF" },
    ],
    rows: [],
  }),

  "suporte-admin": {
    tag: "SUPORTE",
    title: "Suporte ao conscrito",
    subtitle: "Chat ao vivo com candidatos e inscritos.",
    variant: "table",
    classified: false,
    stats: [],
    columns: [],
    rows: [],
  },
};

export function getModuleConfig(view: AdminView): ModuleConfig {
  const cfg = REGISTRY[view];
  if (cfg) return cfg;
  const meta = getPlaceholderMeta(view);
  return {
    tag: meta.tag ?? "COMANDO",
    title: meta.title,
    subtitle: meta.desc,
    variant: "table",
    stats: [{ label: "Registros", value: 0, color: C.olive }],
    columns: [{ key: "info", label: "INFORMAÇÃO" }],
    rows: [{ info: "Nenhum registro no momento." }],
  };
}
