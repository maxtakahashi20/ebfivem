import type { AdminView } from "@/config/admin-nav";

export type ModuloDbSpec = {
  table: string;
  filter?: Record<string, string | number | boolean>;
  /** Colunas da UI → campos do banco (ou formatadores) */
  rowMap: (row: Record<string, unknown>) => Record<string, string>;
};

function fmtDate(d: unknown): string {
  if (!d) return "—";
  const s = String(d);
  if (s.includes("T")) {
    const dt = new Date(s);
    return dt.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return s;
}

function fmtDateShort(d: unknown): string {
  if (!d) return "—";
  const s = String(d);
  if (s.includes("T")) return new Date(s).toLocaleDateString("pt-BR");
  return s;
}

const str = (v: unknown) => (v == null || v === "" ? "—" : String(v));

/** Views que leem do Supabase (demais = UI estática / inscricoes / comunicados dedicado) */
export const MODULO_DB: Partial<Record<AdminView, ModuloDbSpec>> = {
  "recrutamento-entrevistas": {
    table: "entrevistas",
    rowMap: (r) => ({
      candidato: str(r.candidato),
      instrutor: str(r.instrutor),
      data: fmtDate(r.data_hora),
      status: str(r.status),
    }),
  },
  "ops-ativas": {
    table: "operacoes",
    filter: { situacao: "ativa" },
    rowMap: (r) => ({
      codigo: str(r.codigo),
      nome: str(r.nome),
      lider: str(r.lider),
      status: str(r.status),
      inicio: fmtDate(r.inicio),
    }),
  },
  "intel-relatorios": {
    table: "intel_relatorios",
    rowMap: (r) => ({
      ref: str(r.ref),
      assunto: str(r.assunto),
      classificacao: str(r.classificacao),
      data: fmtDateShort(r.data_evento),
    }),
  },
  "intel-investigacao": {
    table: "intel_investigacoes",
    rowMap: (r) => ({
      caso: str(r.caso),
      titulo: str(r.titulo),
      responsavel: str(r.responsavel),
      status: str(r.status),
    }),
  },
  "intel-suspeitos": {
    table: "intel_suspeitos",
    rowMap: (r) => ({
      cod: str(r.cod),
      alias: str(r.alias),
      risco: str(r.risco),
      ultima: str(r.ultima_avistagem),
    }),
  },
  "intel-blacklist": {
    table: "intel_blacklist",
    rowMap: (r) => ({
      id: str(r.registro_id),
      nome: str(r.identificacao),
      motivo: str(r.motivo),
      desde: fmtDateShort(r.desde),
    }),
  },
  "intel-sigilosos": {
    table: "intel_docs_sigilosos",
    rowMap: (r) => ({
      doc: str(r.doc),
      titulo: str(r.titulo),
      nivel: str(r.nivel),
      acesso: str(r.acesso),
    }),
  },
  "efetivo-ativos": {
    table: "militares",
    filter: { categoria: "ativo" },
    rowMap: (r) => ({
      id:
        str(r.codigo) ||
        (r.discord_user_id ? `DSC-${String(r.discord_user_id).slice(-6)}` : "—"),
      nome: str(r.nome),
      patente: str(r.patente) || "—",
      discord: str(r.funcao) || (r.discord_user_id ? "Vinculado" : "Manual"),
      status: str(r.status) || "Autenticado",
    }),
  },
  "efetivo-instrutores": {
    table: "militares",
    filter: { categoria: "instrutor" },
    rowMap: (r) => ({
      nome: str(r.nome),
      modulos: str(r.modulos),
      carga: str(r.carga),
    }),
  },
  /** Logs em geral — lista todos os tipos juntos. */
  "logs-geral": {
    table: "logs",
    rowMap: (r) => ({
      hora: fmtDate(r.hora),
      tipo: str(r.tipo),
      usuario: str(r.usuario),
      acao: str(r.acao),
      detalhe: str(r.detalhe ?? r.evento ?? r.componente),
    }),
  },
  "discord-webhooks": {
    table: "discord_webhooks",
    rowMap: (r) => ({
      nome: str(r.nome),
      uso: str(r.uso),
      status: str(r.status),
    }),
  },
  "discord-cargos": {
    table: "discord_cargos",
    rowMap: (r) => ({
      patente: str(r.patente_rp),
      cargo: str(r.cargo_discord),
      auto: str(r.auto_sync),
    }),
  },
  "discord-logs": {
    table: "logs",
    filter: { tipo: "discord" },
    rowMap: (r) => ({
      hora: fmtDate(r.hora).split(" ")[1] ?? fmtDate(r.hora),
      evento: str(r.evento ?? r.detalhe),
    }),
  },
  "discord-sync": {
    table: "discord_sync_eventos",
    rowMap: (r) => ({
      item: str(r.item),
      status: str(r.status),
    }),
  },
  "disc-advertencias": {
    table: "disciplina_advertencias",
    rowMap: (r) => ({
      militar: str(r.militar),
      motivo: str(r.motivo),
      grau: str(r.grau),
      data: fmtDateShort(r.data_evento),
    }),
  },
  "disc-prisoes": {
    table: "disciplina_prisoes",
    rowMap: (r) => ({
      militar: str(r.militar),
      motivo: str(r.motivo),
      tempo: str(r.tempo_rp),
    }),
  },
  "disc-suspensoes": {
    table: "disciplina_suspensoes",
    rowMap: (r) => ({
      militar: str(r.militar),
      ate: fmtDateShort(r.ate_data),
      motivo: str(r.motivo),
    }),
  },
  "disc-expulsoes": {
    table: "disciplina_expulsoes",
    rowMap: (r) => ({
      militar: str(r.militar),
      motivo: str(r.motivo),
      data: fmtDateShort(r.data_evento),
    }),
  },
  "disc-sindicancias": {
    table: "disciplina_sindicancias",
    rowMap: (r) => ({
      proc: str(r.processo),
      acusado: str(r.acusado),
      status: str(r.status),
    }),
  },
  "restrito-intel": {
    table: "documentos_restritos",
    filter: { tipo: "intel" },
    rowMap: (r) => ({
      ref: str(r.ref),
      titulo: str(r.titulo),
      nivel: str(r.nivel),
      arquivo: str(r.pdf_filename),
    }),
  },
  "restrito-ops": {
    table: "documentos_restritos",
    filter: { tipo: "ops_sigilosa" },
    rowMap: (r) => ({
      codigo: str(r.codigo),
      nome: str(r.titulo),
      acesso: str(r.acesso),
      arquivo: str(r.pdf_filename),
    }),
  },
  "restrito-docs": {
    table: "documentos_restritos",
    filter: { tipo: "interno" },
    rowMap: (r) => ({
      doc: str(r.codigo),
      titulo: str(r.titulo),
      custodia: str(r.custodia),
      arquivo: str(r.pdf_filename),
    }),
  },
  "sys-sessoes": {
    table: "sessoes_admin",
    rowMap: (r) => ({
      inicio: fmtDate(r.inicio),
      ip: str(r.origem),
      status: str(r.status),
    }),
  },
  "sys-backup": {
    table: "backups_registro",
    rowMap: (r) => ({
      id: str(r.backup_id),
      tipo: str(r.tipo),
      tamanho: str(r.tamanho),
      data: fmtDate(r.data_backup),
    }),
  },
};

/** Tabelas listadas na view sys-db */
export const TABELAS_SISTEMA = [
  "inscricoes",
  "entrevistas",
  "operacoes",
  "militares",
  "comunicados",
  "intel_relatorios",
  "intel_investigacoes",
  "intel_suspeitos",
  "intel_blacklist",
  "intel_docs_sigilosos",
  "logs",
  "discord_webhooks",
  "discord_cargos",
  "discord_sync_eventos",
  "disciplina_advertencias",
  "disciplina_prisoes",
  "disciplina_suspensoes",
  "disciplina_expulsoes",
  "disciplina_sindicancias",
  "documentos_restritos",
  "sessoes_admin",
  "backups_registro",
  "discord_membros",
  "identidades_militares",
  "documentos_emitidos",
  "suporte_tickets",
  "suporte_mensagens",
] as const;

/** Views suportam upload/download de PDF anexo (campos pdf_path/pdf_filename...). */
export const PDF_RESTRITO_VIEWS = new Set<AdminView>([
  "restrito-intel",
  "restrito-ops",
  "restrito-docs",
]);
