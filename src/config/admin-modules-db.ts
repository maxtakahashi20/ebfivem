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
    return dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
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
  "ops-historico": {
    table: "operacoes",
    filter: { situacao: "concluida" },
    rowMap: (r) => ({
      codigo: str(r.codigo),
      nome: str(r.nome),
      resultado: str(r.resultado),
      encerramento: fmtDate(r.encerramento),
    }),
  },
  "ops-briefings": {
    table: "briefings",
    rowMap: (r) => ({
      doc: str(r.doc),
      titulo: str(r.titulo),
      autor: str(r.autor),
      data: fmtDateShort(r.data_emissao),
    }),
  },
  "ops-missoes": {
    table: "missoes",
    rowMap: (r) => ({
      id: str(r.codigo),
      objetivo: str(r.objetivo),
      prioridade: str(r.prioridade),
      prazo: fmtDateShort(r.prazo),
    }),
  },
  "ops-patrulhas": {
    table: "patrulhas",
    rowMap: (r) => ({
      rota: str(r.rota),
      setor: str(r.setor),
      viatura: str(r.viatura),
      horario: str(r.horario),
    }),
  },
  "treino-sat": {
    table: "treinamentos",
    filter: { tipo: "sat" },
    rowMap: (r) => ({
      militar: str(r.militar),
      nota: str(r.nota),
      status: str(r.status),
      data: fmtDateShort(r.data_avaliacao),
    }),
  },
  "treino-cqb": {
    table: "treinamentos",
    filter: { tipo: "cqb" },
    rowMap: (r) => ({
      turma: str(r.turma),
      instrutor: str(r.instrutor),
      local: str(r.local),
      proxima: fmtDate(r.proxima_aula),
    }),
  },
  "treino-taf": {
    table: "treinamentos",
    filter: { tipo: "taf" },
    rowMap: (r) => ({
      militar: str(r.militar),
      corrida: str(r.corrida),
      flexoes: str(r.flexoes),
      resultado: str(r.resultado),
    }),
  },
  "treino-cursos": {
    table: "cursos",
    rowMap: (r) => ({
      codigo: str(r.codigo),
      nome: str(r.nome),
      carga: str(r.carga_horas),
      vagas: str(r.vagas),
    }),
  },
  "treino-presenca": {
    table: "presencas_treino",
    rowMap: (r) => ({
      treino: str(r.treino),
      presentes: str(r.presentes),
      ausentes: str(r.ausentes),
      data: fmtDateShort(r.data_registro),
    }),
  },
  "treino-instrutores": {
    table: "instrutores_escala",
    rowMap: (r) => ({
      nome: str(r.nome),
      especialidade: str(r.especialidade),
      turmas: str(r.turmas),
      status: str(r.status),
    }),
  },
  "com-avisos": {
    table: "avisos",
    rowMap: (r) => ({
      titulo: str(r.titulo),
      emitido: str(r.emitido),
      data: fmtDateShort(r.data_evento),
      status: str(r.status),
    }),
  },
  "com-alertas": {
    table: "alertas",
    rowMap: (r) => ({
      nivel: str(r.nivel),
      mensagem: str(r.mensagem),
      data: fmtDate(r.data_evento),
    }),
  },
  "com-emergencia": {
    table: "protocolos_emergencia",
    rowMap: (r) => ({
      protocolo: str(r.protocolo),
      descricao: str(r.descricao),
      ultimo: str(r.ultimo_uso),
    }),
  },
  "com-broadcast": {
    table: "broadcasts",
    rowMap: (r) => ({
      canal: str(r.canal),
      alcance: str(r.alcance),
      data: fmtDate(r.data_evento),
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
  "mil-patentes": {
    table: "patentes",
    rowMap: (r) => ({
      patente: str(r.patente),
      qtd: str(r.qtd),
      insignia: str(r.insignia),
    }),
  },
  "mil-medalhas": {
    table: "medalhas",
    rowMap: (r) => ({
      medalha: str(r.medalha),
      criterio: str(r.criterio),
      concedidas: str(r.concedidas),
    }),
  },
  "mil-promocoes": {
    table: "promocoes",
    rowMap: (r) => ({
      militar: str(r.militar),
      de: str(r.de_patente),
      para: str(r.para_patente),
      data: fmtDateShort(r.data_promocao),
    }),
  },
  "mil-honrarias": {
    table: "honrarias",
    rowMap: (r) => ({
      honra: str(r.honra),
      militar: str(r.militar),
      data: fmtDateShort(r.data_honra),
    }),
  },
  "efetivo-ativos": {
    table: "militares",
    filter: { categoria: "ativo" },
    rowMap: (r) => ({
      id: str(r.codigo) || (r.discord_user_id ? `DSC-${String(r.discord_user_id).slice(-6)}` : "—"),
      nome: str(r.nome),
      patente: str(r.patente) || "—",
      discord: str(r.funcao) || (r.discord_user_id ? "Vinculado" : "Manual"),
      status: str(r.status) || "Autenticado",
    }),
  },
  "efetivo-oficiais": {
    table: "militares",
    filter: { categoria: "oficial" },
    rowMap: (r) => ({
      nome: str(r.nome),
      posto: str(r.posto),
      funcao: str(r.funcao),
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
  "efetivo-recrutas": {
    table: "militares",
    filter: { categoria: "recruta" },
    rowMap: (r) => ({
      nome: str(r.nome),
      turma: str(r.turma),
      fase: str(r.fase),
      instrutor: str(r.instrutor),
    }),
  },
  "efetivo-inativos": {
    table: "militares",
    filter: { categoria: "inativo" },
    rowMap: (r) => ({
      nome: str(r.nome),
      motivo: str(r.motivo),
      desde: fmtDateShort(r.desde),
    }),
  },
  "logs-admin": {
    table: "logs",
    filter: { tipo: "admin" },
    rowMap: (r) => ({
      hora: fmtDate(r.hora).split(" ")[1] ?? fmtDate(r.hora),
      usuario: str(r.usuario),
      acao: str(r.acao),
    }),
  },
  "logs-discord": {
    table: "logs",
    filter: { tipo: "discord" },
    rowMap: (r) => ({
      hora: fmtDate(r.hora).split(" ")[1] ?? fmtDate(r.hora),
      tipo: str(r.evento),
      detalhe: str(r.detalhe),
    }),
  },
  "logs-ops": {
    table: "logs",
    filter: { tipo: "operacional" },
    rowMap: (r) => ({
      hora: fmtDate(r.hora).split(" ")[1] ?? fmtDate(r.hora),
      op: str(r.op_codigo),
      evento: str(r.evento),
    }),
  },
  "logs-sistema": {
    table: "logs",
    filter: { tipo: "sistema" },
    rowMap: (r) => ({
      data: fmtDate(r.hora),
      componente: str(r.componente),
      evento: str(r.evento),
    }),
  },
  "mapa-bases": {
    table: "bases_taticas",
    rowMap: (r) => ({
      base: str(r.base),
      coords: str(r.coords),
      status: str(r.status),
    }),
  },
  "mapa-ops": {
    table: "operacoes",
    filter: { situacao: "ativa" },
    rowMap: (r) => ({
      area: str(r.area),
      op: str(r.nome),
      nivel: str(r.nivel_risco),
    }),
  },
  "mapa-zonas": {
    table: "zonas_vermelhas",
    rowMap: (r) => ({
      zona: str(r.zona),
      motivo: str(r.motivo),
      desde: fmtDateShort(r.desde),
    }),
  },
  "mapa-patrulhas": {
    table: "patrulhas",
    filter: { ativa: true },
    rowMap: (r) => ({
      rota: str(r.rota),
      setor: str(r.setor),
      viatura: str(r.viatura),
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
  "agenda-treinos": {
    table: "agenda_eventos",
    filter: { tipo: "treino" },
    rowMap: (r) => ({
      data: fmtDate(r.data_hora),
      evento: str(r.evento ?? r.titulo),
      local: str(r.local),
    }),
  },
  "agenda-ops": {
    table: "agenda_eventos",
    filter: { tipo: "operacao" },
    rowMap: (r) => ({
      data: fmtDate(r.data_hora),
      op: str(r.titulo ?? r.evento),
      comandante: str(r.comandante),
    }),
  },
  "agenda-entrevistas": {
    table: "agenda_eventos",
    filter: { tipo: "entrevista" },
    rowMap: (r) => ({
      data: fmtDate(r.data_hora),
      candidato: str(r.candidato),
      instrutor: str(r.instrutor),
    }),
  },
  "agenda-reunioes": {
    table: "agenda_eventos",
    filter: { tipo: "reuniao" },
    rowMap: (r) => ({
      data: fmtDate(r.data_hora),
      titulo: str(r.titulo),
      participantes: str(r.participantes),
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
    }),
  },
  "restrito-ops": {
    table: "documentos_restritos",
    filter: { tipo: "ops_sigilosa" },
    rowMap: (r) => ({
      codigo: str(r.codigo),
      nome: str(r.titulo),
      acesso: str(r.acesso),
    }),
  },
  "restrito-docs": {
    table: "documentos_restritos",
    filter: { tipo: "interno" },
    rowMap: (r) => ({
      doc: str(r.codigo),
      titulo: str(r.titulo),
      custodia: str(r.custodia),
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
  "briefings",
  "missoes",
  "patrulhas",
  "treinamentos",
  "cursos",
  "presencas_treino",
  "instrutores_escala",
  "militares",
  "patentes",
  "medalhas",
  "promocoes",
  "honrarias",
  "comunicados",
  "avisos",
  "alertas",
  "protocolos_emergencia",
  "broadcasts",
  "intel_relatorios",
  "intel_investigacoes",
  "intel_suspeitos",
  "intel_blacklist",
  "intel_docs_sigilosos",
  "logs",
  "bases_taticas",
  "zonas_vermelhas",
  "discord_webhooks",
  "discord_cargos",
  "discord_sync_eventos",
  "agenda_eventos",
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
] as const;
