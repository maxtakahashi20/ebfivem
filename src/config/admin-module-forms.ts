import type { AdminView } from "@/config/admin-nav";
import { MODULO_DB } from "@/config/admin-modules-db";

export type ModuloFormField = {
  key: string;
  label: string;
  dbColumn: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "date" | "datetime-local";
};

export type ModuloFormSpec = {
  fields: ModuloFormField[];
  defaults?: Record<string, unknown>;
};

/** Mapeamento explícito UI → colunas do banco por módulo */
const FORMS: Partial<Record<AdminView, ModuloFormSpec>> = {
  "recrutamento-entrevistas": {
    fields: [
      { key: "candidato", label: "Candidato", dbColumn: "candidato", required: true },
      { key: "instrutor", label: "Instrutor", dbColumn: "instrutor" },
      { key: "data", label: "Data/hora", dbColumn: "data_hora", type: "datetime-local" },
      { key: "status", label: "Status", dbColumn: "status", placeholder: "Pendente" },
    ],
    defaults: { status: "Pendente" },
  },
  "ops-ativas": {
    fields: [
      { key: "codigo", label: "Código", dbColumn: "codigo", required: true },
      { key: "nome", label: "Operação", dbColumn: "nome", required: true },
      { key: "lider", label: "Comandante", dbColumn: "lider" },
      { key: "status", label: "Status", dbColumn: "status", placeholder: "Em execução" },
    ],
    defaults: { situacao: "ativa", status: "Em execução" },
  },
  "intel-relatorios": {
    fields: [
      { key: "ref", label: "Referência", dbColumn: "ref", required: true },
      { key: "assunto", label: "Assunto", dbColumn: "assunto", required: true },
      { key: "classificacao", label: "Classificação", dbColumn: "classificacao" },
    ],
  },
  "intel-blacklist": {
    fields: [
      { key: "id", label: "ID", dbColumn: "registro_id", required: true },
      { key: "nome", label: "Identificação", dbColumn: "identificacao", required: true },
      { key: "motivo", label: "Motivo", dbColumn: "motivo", required: true },
    ],
  },
  "intel-investigacao": {
    fields: [
      { key: "caso", label: "Caso", dbColumn: "caso", required: true },
      { key: "titulo", label: "Título", dbColumn: "titulo", required: true },
      { key: "responsavel", label: "Responsável", dbColumn: "responsavel" },
    ],
    defaults: { status: "Em curso" },
  },
  "intel-suspeitos": {
    fields: [
      { key: "cod", label: "Código", dbColumn: "cod", required: true },
      { key: "alias", label: "Alias", dbColumn: "alias", required: true },
      { key: "risco", label: "Risco", dbColumn: "risco", placeholder: "Médio" },
    ],
  },
  "intel-sigilosos": {
    fields: [
      { key: "doc", label: "Documento", dbColumn: "doc", required: true },
      { key: "titulo", label: "Título", dbColumn: "titulo", required: true },
      { key: "nivel", label: "Nível", dbColumn: "nivel" },
      { key: "acesso", label: "Acesso", dbColumn: "acesso" },
    ],
  },
  "efetivo-ativos": {
    fields: [
      { key: "id", label: "ID CMF", dbColumn: "codigo", required: true },
      { key: "nome", label: "Nome", dbColumn: "nome", required: true },
      { key: "patente", label: "Patente", dbColumn: "patente" },
      { key: "status", label: "Status", dbColumn: "status", placeholder: "Autenticado" },
    ],
    defaults: { categoria: "ativo", status: "Manual" },
  },
  "efetivo-instrutores": {
    fields: [
      { key: "nome", label: "Nome", dbColumn: "nome", required: true },
      { key: "modulos", label: "Módulos", dbColumn: "modulos" },
      { key: "carga", label: "Carga semanal", dbColumn: "carga" },
    ],
    defaults: { categoria: "instrutor" },
  },
  "disc-advertencias": {
    fields: [
      { key: "militar", label: "Militar", dbColumn: "militar", required: true },
      { key: "motivo", label: "Motivo", dbColumn: "motivo", required: true },
      { key: "grau", label: "Grau", dbColumn: "grau", placeholder: "Leve" },
    ],
  },
  "disc-prisoes": {
    fields: [
      { key: "militar", label: "Militar", dbColumn: "militar", required: true },
      { key: "motivo", label: "Motivo", dbColumn: "motivo", required: true },
      { key: "tempo", label: "Tempo RP", dbColumn: "tempo_rp" },
    ],
  },
  "disc-suspensoes": {
    fields: [
      { key: "militar", label: "Militar", dbColumn: "militar", required: true },
      { key: "ate", label: "Até", dbColumn: "ate_data", type: "date" },
      { key: "motivo", label: "Motivo", dbColumn: "motivo" },
    ],
  },
  "disc-expulsoes": {
    fields: [
      { key: "militar", label: "Militar", dbColumn: "militar", required: true },
      { key: "motivo", label: "Motivo", dbColumn: "motivo", required: true },
      { key: "data", label: "Data", dbColumn: "data_evento", type: "date" },
    ],
  },
  "disc-sindicancias": {
    fields: [
      { key: "proc", label: "Processo", dbColumn: "processo", required: true },
      { key: "acusado", label: "Acusado", dbColumn: "acusado", required: true },
      { key: "status", label: "Status", dbColumn: "status", placeholder: "Instrução" },
    ],
    defaults: { status: "Instrução" },
  },
  "discord-webhooks": {
    fields: [
      { key: "nome", label: "Canal", dbColumn: "nome", required: true },
      { key: "uso", label: "Uso", dbColumn: "uso" },
      { key: "status", label: "Status", dbColumn: "status", placeholder: "Ativo" },
    ],
    defaults: { status: "Ativo" },
  },
  "discord-cargos": {
    fields: [
      { key: "patente", label: "Patente RP", dbColumn: "patente_rp", required: true },
      { key: "cargo", label: "Cargo Discord", dbColumn: "cargo_discord", required: true },
      { key: "auto", label: "Sync automático", dbColumn: "auto_sync", placeholder: "Sim" },
    ],
    defaults: { auto_sync: "Sim" },
  },
  "restrito-intel": {
    fields: [
      { key: "ref", label: "Referência", dbColumn: "ref", required: true },
      { key: "titulo", label: "Título", dbColumn: "titulo", required: true },
      { key: "nivel", label: "Nível", dbColumn: "nivel" },
    ],
    defaults: { tipo: "intel" },
  },
  "restrito-ops": {
    fields: [
      { key: "codigo", label: "Código", dbColumn: "codigo", required: true },
      { key: "nome", label: "Nome", dbColumn: "titulo", required: true },
      { key: "acesso", label: "Acesso", dbColumn: "acesso" },
    ],
    defaults: { tipo: "ops_sigilosa" },
  },
  "restrito-docs": {
    fields: [
      { key: "doc", label: "Documento", dbColumn: "codigo", required: true },
      { key: "titulo", label: "Título", dbColumn: "titulo", required: true },
      { key: "custodia", label: "Custódia", dbColumn: "custodia" },
    ],
    defaults: { tipo: "interno" },
  },
  "sys-sessoes": {
    fields: [
      { key: "origem", label: "Origem", dbColumn: "origem", placeholder: "Painel ADMCMF" },
      { key: "status", label: "Status", dbColumn: "status", placeholder: "Ativa" },
    ],
    defaults: { status: "Ativa", origem: "Painel ADMCMF" },
  },
  "logs-geral": {
    fields: [
      { key: "tipo", label: "Tipo", dbColumn: "tipo", placeholder: "admin | discord | operacional | sistema", required: true },
      { key: "usuario", label: "Operador", dbColumn: "usuario" },
      { key: "acao", label: "Ação", dbColumn: "acao" },
      { key: "detalhe", label: "Detalhe", dbColumn: "detalhe" },
    ],
    defaults: { tipo: "admin", usuario: "Painel ADMCMF" },
  },
  "discord-logs": {
    fields: [
      { key: "evento", label: "Evento", dbColumn: "evento", required: true },
    ],
    defaults: { tipo: "discord" },
  },
};

/** Rótulo do botão principal quando o registry não define primaryAction */
export const ACAO_LABEL: Partial<Record<AdminView, string>> = {
  "disc-prisoes": "Registrar prisão",
  "disc-suspensoes": "Registrar suspensão",
  "disc-expulsoes": "Registrar expulsão",
  "restrito-intel": "Novo documento",
  "restrito-ops": "Nova OP sigilosa",
  "restrito-docs": "Novo documento interno",
  "sys-sessoes": "Registrar sessão",
  "intel-sigilosos": "Novo documento sigiloso",
  "efetivo-instrutores": "Cadastrar instrutor",
  "logs-geral": "Registrar log",
  "discord-logs": "Registrar log",
};

export function getModuloForm(view: AdminView): ModuloFormSpec | null {
  const spec = FORMS[view];
  if (!spec) return null;
  const dbFilter = MODULO_DB[view]?.filter ?? {};
  return {
    fields: spec.fields,
    defaults: { ...spec.defaults, ...dbFilter },
  };
}

export type AcaoEspecial = "discord-sync" | "sys-backup";

export function getAcaoEspecial(view: AdminView): AcaoEspecial | null {
  if (view === "discord-sync") return "discord-sync";
  if (view === "sys-backup") return "sys-backup";
  return null;
}

/** Texto do botão de cadastro (registry → mapa → padrão) */
export function getLabelAcao(view: AdminView, primaryAction?: string): string | null {
  if (primaryAction) return primaryAction;
  if (ACAO_LABEL[view]) return ACAO_LABEL[view]!;
  if (FORMS[view] && MODULO_DB[view]) return "Cadastrar registro";
  return null;
}
