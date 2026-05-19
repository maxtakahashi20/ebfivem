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
  "ops-briefings": {
    fields: [
      { key: "doc", label: "Documento", dbColumn: "doc", required: true },
      { key: "titulo", label: "Título", dbColumn: "titulo", required: true },
      { key: "autor", label: "Autor", dbColumn: "autor" },
    ],
  },
  "ops-missoes": {
    fields: [
      { key: "id", label: "Código", dbColumn: "codigo", required: true },
      { key: "objetivo", label: "Objetivo", dbColumn: "objetivo", required: true },
      { key: "prioridade", label: "Prioridade", dbColumn: "prioridade", placeholder: "Média" },
      { key: "prazo", label: "Prazo", dbColumn: "prazo", type: "date" },
    ],
    defaults: { prioridade: "Média" },
  },
  "ops-patrulhas": {
    fields: [
      { key: "rota", label: "Rota", dbColumn: "rota", required: true },
      { key: "setor", label: "Setor", dbColumn: "setor" },
      { key: "viatura", label: "Viatura", dbColumn: "viatura" },
      { key: "horario", label: "Horário", dbColumn: "horario" },
    ],
    defaults: { ativa: true },
  },
  "com-avisos": {
    fields: [
      { key: "titulo", label: "Título", dbColumn: "titulo", required: true },
      { key: "emitido", label: "Emitido por", dbColumn: "emitido" },
      { key: "status", label: "Status", dbColumn: "status", placeholder: "Ativo" },
    ],
    defaults: { status: "Ativo" },
  },
  "com-alertas": {
    fields: [
      { key: "nivel", label: "Nível", dbColumn: "nivel", required: true },
      { key: "mensagem", label: "Mensagem", dbColumn: "mensagem", required: true },
    ],
  },
  "com-emergencia": {
    fields: [
      { key: "protocolo", label: "Protocolo", dbColumn: "protocolo", required: true },
      { key: "descricao", label: "Descrição", dbColumn: "descricao", required: true },
    ],
    defaults: { ultimo_uso: "—" },
  },
  "com-broadcast": {
    fields: [
      { key: "canal", label: "Canal", dbColumn: "canal", required: true },
      { key: "alcance", label: "Alcance", dbColumn: "alcance" },
    ],
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
  "efetivo-ativos": {
    fields: [
      { key: "id", label: "ID CMF", dbColumn: "codigo", required: true },
      { key: "nome", label: "Nome", dbColumn: "nome", required: true },
      { key: "patente", label: "Patente", dbColumn: "patente" },
      { key: "status", label: "Status", dbColumn: "status", placeholder: "Autenticado" },
    ],
    defaults: { categoria: "ativo", status: "Manual" },
  },
  "agenda-treinos": {
    fields: [
      { key: "data", label: "Data/hora", dbColumn: "data_hora", type: "datetime-local", required: true },
      { key: "evento", label: "Treino", dbColumn: "evento", required: true },
      { key: "local", label: "Local", dbColumn: "local" },
    ],
    defaults: { tipo: "treino" },
  },
  "agenda-ops": {
    fields: [
      { key: "data", label: "Data/hora", dbColumn: "data_hora", type: "datetime-local", required: true },
      { key: "op", label: "Operação", dbColumn: "titulo", required: true },
      { key: "comandante", label: "Comandante", dbColumn: "comandante" },
    ],
    defaults: { tipo: "operacao" },
  },
  "agenda-entrevistas": {
    fields: [
      { key: "data", label: "Data/hora", dbColumn: "data_hora", type: "datetime-local", required: true },
      { key: "candidato", label: "Candidato", dbColumn: "candidato", required: true },
      { key: "instrutor", label: "Instrutor", dbColumn: "instrutor" },
    ],
    defaults: { tipo: "entrevista" },
  },
  "agenda-reunioes": {
    fields: [
      { key: "data", label: "Data/hora", dbColumn: "data_hora", type: "datetime-local", required: true },
      { key: "titulo", label: "Título", dbColumn: "titulo", required: true },
      { key: "participantes", label: "Participantes", dbColumn: "participantes" },
    ],
    defaults: { tipo: "reuniao" },
  },
  "disc-advertencias": {
    fields: [
      { key: "militar", label: "Militar", dbColumn: "militar", required: true },
      { key: "motivo", label: "Motivo", dbColumn: "motivo", required: true },
      { key: "grau", label: "Grau", dbColumn: "grau", placeholder: "Leve" },
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
  "mapa-bases": {
    fields: [
      { key: "base", label: "Base", dbColumn: "base", required: true },
      { key: "coords", label: "Coordenadas", dbColumn: "coords" },
      { key: "status", label: "Status", dbColumn: "status", placeholder: "Operacional" },
    ],
    defaults: { status: "Operacional" },
  },
  "mapa-zonas": {
    fields: [
      { key: "zona", label: "Zona", dbColumn: "zona", required: true },
      { key: "motivo", label: "Motivo", dbColumn: "motivo", required: true },
    ],
  },
  "mapa-ops": {
    fields: [
      { key: "area", label: "Área", dbColumn: "area", required: true },
      { key: "op", label: "Operação", dbColumn: "nome", required: true },
      { key: "nivel", label: "Risco", dbColumn: "nivel_risco", placeholder: "Alto" },
    ],
    defaults: { situacao: "ativa" },
  },
  "mapa-patrulhas": {
    fields: [
      { key: "rota", label: "Rota", dbColumn: "rota", required: true },
      { key: "setor", label: "Setor", dbColumn: "setor" },
      { key: "viatura", label: "Viatura", dbColumn: "viatura" },
    ],
    defaults: { ativa: true },
  },
  "treino-sat": {
    fields: [
      { key: "militar", label: "Militar", dbColumn: "militar", required: true },
      { key: "nota", label: "Nota", dbColumn: "nota" },
      { key: "status", label: "Status", dbColumn: "status", placeholder: "Aprovado" },
    ],
    defaults: { tipo: "sat" },
  },
  "treino-cqb": {
    fields: [
      { key: "turma", label: "Turma", dbColumn: "turma", required: true },
      { key: "instrutor", label: "Instrutor", dbColumn: "instrutor" },
      { key: "local", label: "Local", dbColumn: "local" },
    ],
    defaults: { tipo: "cqb" },
  },
  "treino-taf": {
    fields: [
      { key: "militar", label: "Militar", dbColumn: "militar", required: true },
      { key: "corrida", label: "Corrida", dbColumn: "corrida" },
      { key: "flexoes", label: "Flexões", dbColumn: "flexoes" },
      { key: "resultado", label: "Resultado", dbColumn: "resultado" },
    ],
    defaults: { tipo: "taf" },
  },
  "treino-cursos": {
    fields: [
      { key: "codigo", label: "Código", dbColumn: "codigo", required: true },
      { key: "nome", label: "Curso", dbColumn: "nome", required: true },
      { key: "carga", label: "Carga horária", dbColumn: "carga_horas" },
      { key: "vagas", label: "Vagas", dbColumn: "vagas" },
    ],
  },
  "treino-presenca": {
    fields: [
      { key: "treino", label: "Treino", dbColumn: "treino", required: true },
      { key: "presentes", label: "Presentes", dbColumn: "presentes" },
      { key: "ausentes", label: "Ausentes", dbColumn: "ausentes" },
    ],
  },
  "treino-instrutores": {
    fields: [
      { key: "nome", label: "Instrutor", dbColumn: "nome", required: true },
      { key: "especialidade", label: "Especialidade", dbColumn: "especialidade" },
      { key: "turmas", label: "Turmas", dbColumn: "turmas" },
    ],
    defaults: { status: "Disponível" },
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
  "mil-patentes": {
    fields: [
      { key: "patente", label: "Patente", dbColumn: "patente", required: true },
      { key: "qtd", label: "Efetivo", dbColumn: "qtd" },
      { key: "insignia", label: "Insígnia", dbColumn: "insignia" },
    ],
  },
  "mil-medalhas": {
    fields: [
      { key: "medalha", label: "Medalha", dbColumn: "medalha", required: true },
      { key: "criterio", label: "Critério", dbColumn: "criterio" },
      { key: "concedidas", label: "Concedidas", dbColumn: "concedidas" },
    ],
  },
  "mil-promocoes": {
    fields: [
      { key: "militar", label: "Militar", dbColumn: "militar", required: true },
      { key: "de", label: "De", dbColumn: "de_patente", required: true },
      { key: "para", label: "Para", dbColumn: "para_patente", required: true },
      { key: "data", label: "Data", dbColumn: "data_promocao", type: "date" },
    ],
  },
  "mil-honrarias": {
    fields: [
      { key: "honra", label: "Honra", dbColumn: "honra", required: true },
      { key: "militar", label: "Militar", dbColumn: "militar", required: true },
      { key: "data", label: "Data", dbColumn: "data_honra", type: "date" },
    ],
  },
  "efetivo-oficiais": {
    fields: [
      { key: "nome", label: "Nome", dbColumn: "nome", required: true },
      { key: "posto", label: "Posto", dbColumn: "posto" },
      { key: "funcao", label: "Função", dbColumn: "funcao" },
    ],
    defaults: { categoria: "oficial" },
  },
  "efetivo-instrutores": {
    fields: [
      { key: "nome", label: "Nome", dbColumn: "nome", required: true },
      { key: "modulos", label: "Módulos", dbColumn: "modulos" },
      { key: "carga", label: "Carga semanal", dbColumn: "carga" },
    ],
    defaults: { categoria: "instrutor" },
  },
  "efetivo-recrutas": {
    fields: [
      { key: "nome", label: "Nome", dbColumn: "nome", required: true },
      { key: "turma", label: "Turma", dbColumn: "turma" },
      { key: "fase", label: "Fase", dbColumn: "fase" },
      { key: "instrutor", label: "Instrutor", dbColumn: "instrutor" },
    ],
    defaults: { categoria: "recruta" },
  },
  "efetivo-inativos": {
    fields: [
      { key: "nome", label: "Nome", dbColumn: "nome", required: true },
      { key: "motivo", label: "Motivo", dbColumn: "motivo" },
      { key: "desde", label: "Desde", dbColumn: "desde", type: "date" },
    ],
    defaults: { categoria: "inativo" },
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
  "ops-historico": {
    fields: [
      { key: "codigo", label: "Código", dbColumn: "codigo", required: true },
      { key: "nome", label: "Operação", dbColumn: "nome", required: true },
      { key: "resultado", label: "Resultado", dbColumn: "resultado" },
    ],
    defaults: { situacao: "concluida", status: "Concluída" },
  },
  "logs-admin": {
    fields: [
      { key: "usuario", label: "Operador", dbColumn: "usuario" },
      { key: "acao", label: "Ação", dbColumn: "acao", required: true },
    ],
    defaults: { tipo: "admin", usuario: "Painel ADMCMF" },
  },
  "logs-discord": {
    fields: [
      { key: "evento", label: "Evento", dbColumn: "evento", required: true },
      { key: "detalhe", label: "Detalhe", dbColumn: "detalhe" },
    ],
    defaults: { tipo: "discord" },
  },
  "logs-ops": {
    fields: [
      { key: "op", label: "Código OP", dbColumn: "op_codigo", required: true },
      { key: "evento", label: "Evento", dbColumn: "evento", required: true },
    ],
    defaults: { tipo: "operacional" },
  },
  "logs-sistema": {
    fields: [
      { key: "componente", label: "Componente", dbColumn: "componente", required: true },
      { key: "evento", label: "Evento", dbColumn: "evento", required: true },
    ],
    defaults: { tipo: "sistema" },
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
  "agenda-ops": "Agendar operação",
  "agenda-reunioes": "Agendar reunião",
  "disc-prisoes": "Registrar prisão",
  "disc-suspensoes": "Registrar suspensão",
  "disc-expulsoes": "Registrar expulsão",
  "mil-patentes": "Cadastrar patente",
  "mil-medalhas": "Cadastrar medalha",
  "mil-promocoes": "Registrar promoção",
  "mil-honrarias": "Registrar honraria",
  "restrito-intel": "Novo documento",
  "restrito-ops": "Nova OP sigilosa",
  "restrito-docs": "Novo documento interno",
  "sys-sessoes": "Registrar sessão",
  "intel-sigilosos": "Novo documento sigiloso",
  "efetivo-oficiais": "Cadastrar oficial",
  "efetivo-instrutores": "Cadastrar instrutor",
  "efetivo-recrutas": "Cadastrar recruta",
  "efetivo-inativos": "Registrar inativo",
  "ops-historico": "Registrar no histórico",
  "logs-admin": "Registrar log",
  "logs-discord": "Registrar log",
  "logs-ops": "Registrar log",
  "logs-sistema": "Registrar log",
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
