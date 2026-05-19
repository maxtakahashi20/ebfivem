import type { AdminView } from "@/config/admin-nav";
import { getPlaceholderMeta } from "@/config/admin-nav";

export type ModuleVariant =
  | "table"
  | "map"
  | "defcon"
  | "discord"
  | "logs"
  | "system"
  | "agenda"
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
  mapMode?: "bases" | "ops" | "danger" | "patrol";
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
    rows: [
      { codigo: "OP-2405-A", nome: "Operação Sentinela", lider: "Cap. Mendes", status: "Em execução", inicio: "19/05 20:00" },
      { codigo: "OP-2405-B", nome: "Patrulha Norte", lider: "Sgt. Oliveira", status: "Em execução", inicio: "19/05 21:30" },
      { codigo: "OP-2404-C", nome: "Escolta VIP", lider: "Ten. Rocha", status: "Preparação", inicio: "20/05 18:00" },
      { codigo: "OP-2404-D", nome: "Bloqueio Rodoviário", lider: "Subten. Lima", status: "Em execução", inicio: "19/05 19:00" },
    ],
    primaryAction: "Nova operação",
  }),

  "ops-historico": base("ops-historico", {
    stats: [
      { label: "Concluídas (30d)", value: 17, color: C.green },
      { label: "Taxa de sucesso", value: "94%", color: C.olive },
      { label: "Baixas RP", value: 0, color: C.blue },
    ],
    columns: [
      { key: "codigo", label: "CÓDIGO", mono: true },
      { key: "nome", label: "OPERAÇÃO" },
      { key: "resultado", label: "RESULTADO" },
      { key: "encerramento", label: "ENCERRAMENTO", mono: true },
    ],
    rows: [
      { codigo: "OP-2403-A", nome: "Operação Vigília", resultado: "Sucesso", encerramento: "15/05 23:40" },
      { codigo: "OP-2402-B", nome: "Resgate Alpha", resultado: "Sucesso", encerramento: "12/05 01:15" },
      { codigo: "OP-2401-C", nome: "Cerco Sul", resultado: "Sucesso", encerramento: "08/05 22:00" },
    ],
  }),

  "ops-briefings": base("ops-briefings", {
    stats: [
      { label: "Briefings ativos", value: 6, color: C.olive },
      { label: "Classificados", value: 2, color: C.red },
    ],
    columns: [
      { key: "doc", label: "DOCUMENTO", mono: true },
      { key: "titulo", label: "TÍTULO" },
      { key: "autor", label: "AUTOR" },
      { key: "data", label: "EMITIDO", mono: true },
    ],
    rows: [
      { doc: "BRF-044", titulo: "Plano tático — Sentinela", autor: "Estado-Maior", data: "19/05/2026" },
      { doc: "BRF-043", titulo: "ROE zona norte", autor: "Cap. Mendes", data: "18/05/2026" },
      { doc: "BRF-042", titulo: "Intel pré-op Escolta VIP", autor: "S2", data: "17/05/2026" },
    ],
    primaryAction: "Publicar briefing",
  }),

  "ops-missoes": base("ops-missoes", {
    stats: [
      { label: "Missões cadastradas", value: 12, color: C.olive },
      { label: "Prioridade alta", value: 3, color: C.red },
    ],
    columns: [
      { key: "id", label: "ID", mono: true },
      { key: "objetivo", label: "OBJETIVO" },
      { key: "prioridade", label: "PRIORIDADE" },
      { key: "prazo", label: "PRAZO", mono: true },
    ],
    rows: [
      { id: "MS-101", objetivo: "Neutralizar célula armada", prioridade: "Alta", prazo: "22/05" },
      { id: "MS-102", objetivo: "Reconhecimento aeródromo", prioridade: "Média", prazo: "25/05" },
      { id: "MS-103", objetivo: "Escolta comboio suprimentos", prioridade: "Alta", prazo: "20/05" },
    ],
    primaryAction: "Cadastrar missão",
  }),

  "ops-patrulhas": base("ops-patrulhas", {
    stats: [
      { label: "Patrulhas hoje", value: 5, color: C.blue },
      { label: "Em rota", value: 2, color: C.green },
    ],
    columns: [
      { key: "rota", label: "ROTA", mono: true },
      { key: "setor", label: "SETOR" },
      { key: "viatura", label: "VIATURA" },
      { key: "horario", label: "HORÁRIO", mono: true },
    ],
    rows: [
      { rota: "PTR-01", setor: "Norte / Paleto", viatura: "Humvee 204", horario: "20:00–22:00" },
      { rota: "PTR-02", setor: "Sul / Sandy", viatura: "Blindado 07", horario: "21:00–23:30" },
      { rota: "PTR-03", setor: "Centro / LS", viatura: "Moto tática 12", horario: "22:00–00:00" },
    ],
    primaryAction: "Programar patrulha",
  }),

  "treino-sat": base("treino-sat", {
    stats: [
      { label: "Candidatos", value: 14, color: C.olive },
      { label: "Aprovados última turma", value: 9, color: C.green },
      { label: "Média geral", value: "8.2", color: C.blue },
    ],
    primaryAction: "Registrar avaliação SAT",
    columns: [
      { key: "militar", label: "MILITAR" },
      { key: "nota", label: "NOTA" },
      { key: "status", label: "STATUS" },
      { key: "data", label: "AVALIAÇÃO", mono: true },
    ],
    rows: [
      { militar: "Rec. Silva", nota: "8.5", status: "Aprovado", data: "17/05/2026" },
      { militar: "Rec. Costa", nota: "7.0", status: "Recuperação", data: "17/05/2026" },
      { militar: "Sd. Ferreira", nota: "9.1", status: "Aprovado", data: "10/05/2026" },
    ],
  }),

  "treino-cqb": base("treino-cqb", {
    stats: [
      { label: "Turmas ativas", value: 2, color: C.olive },
      { label: "Participantes", value: 18, color: C.blue },
    ],
    primaryAction: "Nova turma CQB",
    columns: [
      { key: "turma", label: "TURMA", mono: true },
      { key: "instrutor", label: "INSTRUTOR" },
      { key: "local", label: "LOCAL" },
      { key: "proxima", label: "PRÓXIMA", mono: true },
    ],
    rows: [
      { turma: "CQB-A", instrutor: "Instr. Martins", local: "Campo tático B", proxima: "21/05 19:00" },
      { turma: "CQB-B", instrutor: "Instr. Alves", local: "Campo tático B", proxima: "23/05 19:00" },
    ],
  }),

  "treino-taf": base("treino-taf", {
    stats: [
      { label: "Testes este mês", value: 31, color: C.olive },
      { label: "Aptos", value: 27, color: C.green },
    ],
    primaryAction: "Registrar TAF",
    columns: [
      { key: "militar", label: "MILITAR" },
      { key: "corrida", label: "CORRIDA" },
      { key: "flexoes", label: "FLEXÕES" },
      { key: "resultado", label: "RESULTADO" },
    ],
    rows: [
      { militar: "Sd. Ramos", corrida: "Aprovado", flexoes: "Aprovado", resultado: "Apto" },
      { militar: "Rec. Dias", corrida: "Aprovado", flexoes: "Reprovado", resultado: "Inapto" },
    ],
  }),

  "treino-cursos": base("treino-cursos", {
    stats: [
      { label: "Cursos ativos", value: 7, color: C.olive },
      { label: "Vagas abertas", value: 24, color: C.blue },
    ],
    primaryAction: "Novo curso",
    columns: [
      { key: "codigo", label: "CÓDIGO", mono: true },
      { key: "nome", label: "CURSO" },
      { key: "carga", label: "CARGA H." },
      { key: "vagas", label: "VAGAS" },
    ],
    rows: [
      { codigo: "CRS-01", nome: "Operações urbanas", carga: "40h", vagas: "6/12" },
      { codigo: "CRS-04", nome: "Primeiros socorros tático", carga: "16h", vagas: "2/10" },
      { codigo: "CRS-07", nome: "Condução tática", carga: "24h", vagas: "8/8" },
    ],
  }),

  "treino-presenca": base("treino-presenca", {
    stats: [
      { label: "Presença média", value: "89%", color: C.green },
      { label: "Faltas hoje", value: 2, color: C.yellow },
    ],
    primaryAction: "Registrar presença",
    columns: [
      { key: "treino", label: "TREINO" },
      { key: "presentes", label: "PRESENTES" },
      { key: "ausentes", label: "AUSENTES" },
      { key: "data", label: "DATA", mono: true },
    ],
    rows: [
      { treino: "SAT — Turma 3", presentes: "12", ausentes: "1", data: "18/05/2026" },
      { treino: "CQB — Turma A", presentes: "9", ausentes: "0", data: "17/05/2026" },
    ],
  }),

  "treino-instrutores": base("treino-instrutores", {
    stats: [
      { label: "Instrutores ativos", value: 11, color: C.olive },
      { label: "Horas / semana", value: 86, color: C.blue },
    ],
    primaryAction: "Cadastrar instrutor",
    columns: [
      { key: "nome", label: "INSTRUTOR" },
      { key: "especialidade", label: "ESPECIALIDADE" },
      { key: "turmas", label: "TURMAS" },
      { key: "status", label: "STATUS" },
    ],
    rows: [
      { nome: "Instr. Martins", especialidade: "CQB / SAT", turmas: "3", status: "Disponível" },
      { nome: "Instr. Alves", especialidade: "TAF / CQB", turmas: "2", status: "Em treino" },
      { nome: "Cap. Ribeiro", especialidade: "Operações", turmas: "1", status: "Disponível" },
    ],
  }),

  "com-avisos": base("com-avisos", {
    variant: "comunicacao",
    stats: [
      { label: "Avisos ativos", value: 5, color: C.olive },
      { label: "Lidos", value: "92%", color: C.green },
    ],
    columns: [
      { key: "titulo", label: "TÍTULO" },
      { key: "emitido", label: "EMITIDO POR" },
      { key: "data", label: "DATA", mono: true },
      { key: "status", label: "STATUS" },
    ],
    rows: [
      { titulo: "Uniforme obrigatório em OP", emitido: "Comando", data: "19/05/2026", status: "Ativo" },
      { titulo: "Horário QG — feriado", emitido: "Estado-Maior", data: "18/05/2026", status: "Ativo" },
    ],
    primaryAction: "Novo aviso",
  }),

  "com-alertas": base("com-alertas", {
    variant: "comunicacao",
    stats: [{ label: "Alertas ativos", value: 2, color: C.yellow }],
    columns: [
      { key: "nivel", label: "NÍVEL" },
      { key: "mensagem", label: "MENSAGEM" },
      { key: "data", label: "DATA", mono: true },
    ],
    rows: [
      { nivel: "Amarelo", mensagem: "Movimentação suspeita — setor norte", data: "19/05 20:15" },
      { nivel: "Laranja", mensagem: "Reforço solicitado — OP Sentinela", data: "19/05 21:00" },
    ],
    primaryAction: "Emitir alerta",
  }),

  "com-defcon": {
    tag: "COMUNICAÇÃO",
    title: "DEFCON",
    subtitle: "Nível de alerta da unidade.",
    variant: "defcon",
    stats: [{ label: "Nível atual", value: "DEFCON 4", color: C.yellow }],
    columns: [],
    rows: [],
  },

  "com-emergencia": base("com-emergencia", {
    variant: "comunicacao",
    stats: [{ label: "Protocolos", value: 4, color: C.red }],
    columns: [
      { key: "protocolo", label: "PROTOCOLO", mono: true },
      { key: "descricao", label: "DESCRIÇÃO" },
      { key: "ultimo", label: "ÚLTIMO USO", mono: true },
    ],
    rows: [
      { protocolo: "EMG-01", descricao: "Evacuação QG", ultimo: "—" },
      { protocolo: "EMG-02", descricao: "Cerco hostil — LS", ultimo: "12/04/2026" },
    ],
    primaryAction: "Acionar emergência",
  }),

  "com-broadcast": base("com-broadcast", {
    variant: "comunicacao",
    stats: [{ label: "Transmissões (7d)", value: 3, color: C.olive }],
    columns: [
      { key: "canal", label: "CANAL" },
      { key: "alcance", label: "ALCANCE" },
      { key: "data", label: "DATA", mono: true },
    ],
    rows: [
      { canal: "Discord + Rádio", alcance: "Efetivo completo", data: "17/05/2026" },
      { canal: "Discord", alcance: "Oficiais", data: "14/05/2026" },
    ],
    primaryAction: "Nova transmissão",
  }),

  "intel-relatorios": base("intel-relatorios", {
    stats: [{ label: "Relatórios (30d)", value: 22, color: C.olive }],
    columns: [
      { key: "ref", label: "REF", mono: true },
      { key: "assunto", label: "ASSUNTO" },
      { key: "classificacao", label: "CLASS." },
      { key: "data", label: "DATA", mono: true },
    ],
    rows: [
      { ref: "REL-882", assunto: "Mapeamento facções — sul", classificacao: "Reservado", data: "18/05/2026" },
      { ref: "REL-881", assunto: "Padrão de rotas ilegais", classificacao: "Confidencial", data: "16/05/2026" },
    ],
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
    rows: [
      { caso: "INV-204", titulo: "Vazamento documentos", responsavel: "Agente K.", status: "Em curso" },
      { caso: "INV-203", titulo: "Infiltração organizada", responsavel: "Agente M.", status: "Análise" },
    ],
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
    rows: [
      { cod: "SUS-044", alias: "Víbora", risco: "Alto", ultima: "19/05 — Sandy" },
      { cod: "SUS-041", alias: "Desconhecido #12", risco: "Médio", ultima: "17/05 — Paleto" },
    ],
  }),

  "intel-blacklist": base("intel-blacklist", {
    stats: [{ label: "Registros", value: 34, color: C.red }],
    columns: [
      { key: "id", label: "ID", mono: true },
      { key: "nome", label: "IDENTIFICAÇÃO" },
      { key: "motivo", label: "MOTIVO" },
      { key: "desde", label: "DESDE", mono: true },
    ],
    rows: [
      { id: "BL-019", nome: "RG 4429182", motivo: "Traição / OP", desde: "01/05/2026" },
      { id: "BL-018", nome: "Discord: xX_dark", motivo: "Deserção", desde: "28/04/2026" },
    ],
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
    rows: [
      { doc: "SIG-001", titulo: "Plano contingência Alpha", nivel: "Ultra secreto", acesso: "Alto comando" },
      { doc: "SIG-002", titulo: "Lista informantes", nivel: "Secreto", acesso: "S2 + Comando" },
    ],
  }),

  "mil-patentes": base("mil-patentes", {
    stats: [{ label: "Patentes no quadro", value: 14, color: C.olive }],
    primaryAction: "Cadastrar patente",
    columns: [
      { key: "patente", label: "PATENTE" },
      { key: "qtd", label: "EFETIVO" },
      { key: "insignia", label: "INSÍGNIA" },
    ],
    rows: [
      { patente: "Coronel", qtd: "1", insignia: "★★★" },
      { patente: "Capitão", qtd: "4", insignia: "★★" },
      { patente: "Sargento", qtd: "12", insignia: "▲" },
      { patente: "Recruta", qtd: "18", insignia: "—" },
    ],
  }),

  "mil-medalhas": base("mil-medalhas", {
    stats: [{ label: "Condecorações", value: 8, color: C.olive }],
    primaryAction: "Cadastrar medalha",
    columns: [
      { key: "medalha", label: "MEDALHA" },
      { key: "criterio", label: "CRITÉRIO" },
      { key: "concedidas", label: "CONCEDIDAS" },
    ],
    rows: [
      { medalha: "Medalha Mérito Operacional", criterio: "OP de alto risco", concedidas: "24" },
      { medalha: "Estrela Serviço", criterio: "Tempo de serviço", concedidas: "56" },
    ],
  }),

  "mil-promocoes": base("mil-promocoes", {
    stats: [{ label: "Promoções (ano)", value: 31, color: C.green }],
    primaryAction: "Registrar promoção",
    columns: [
      { key: "militar", label: "MILITAR" },
      { key: "de", label: "DE" },
      { key: "para", label: "PARA" },
      { key: "data", label: "DATA", mono: true },
    ],
    rows: [
      { militar: "Sd. Ramos", de: "Soldado", para: "Cabo", data: "10/05/2026" },
      { militar: "Rec. Silva", de: "Recruta", para: "Soldado", data: "03/05/2026" },
    ],
  }),

  "mil-honrarias": base("mil-honrarias", {
    stats: [{ label: "Honrarias registradas", value: 12, color: C.olive }],
    primaryAction: "Registrar honraria",
    columns: [
      { key: "honra", label: "HONRA" },
      { key: "militar", label: "MILITAR" },
      { key: "data", label: "DATA", mono: true },
    ],
    rows: [
      { honra: "Menção honrosa — OP Vigília", militar: "Ten. Rocha", data: "15/05/2026" },
      { honra: "Comenda serviços relevantes", militar: "Sgt. Oliveira", data: "01/05/2026" },
    ],
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
    primaryAction: undefined,
  }),

  "efetivo-oficiais": base("efetivo-oficiais", {
    stats: [{ label: "Oficiais", value: 8, color: C.olive }],
    columns: [
      { key: "nome", label: "NOME" },
      { key: "posto", label: "POSTO" },
      { key: "funcao", label: "FUNÇÃO" },
    ],
    rows: [
      { nome: "Cel. Andrade", posto: "Coronel", funcao: "Comandante" },
      { nome: "Cap. Mendes", posto: "Capitão", funcao: "Operações" },
      { nome: "Ten. Rocha", posto: "Tenente", funcao: "Inteligência" },
    ],
  }),

  "efetivo-instrutores": base("efetivo-instrutores", {
    stats: [{ label: "Instrutores", value: 11, color: C.blue }],
    columns: [
      { key: "nome", label: "NOME" },
      { key: "modulos", label: "MÓDULOS" },
      { key: "carga", label: "CARGA SEM." },
    ],
    rows: [
      { nome: "Instr. Martins", modulos: "CQB, SAT", carga: "12h" },
      { nome: "Instr. Alves", modulos: "TAF, CQB", carga: "10h" },
    ],
  }),

  "efetivo-recrutas": base("efetivo-recrutas", {
    stats: [{ label: "Em formação", value: 18, color: C.yellow }],
    columns: [
      { key: "nome", label: "NOME" },
      { key: "turma", label: "TURMA" },
      { key: "fase", label: "FASE" },
      { key: "instrutor", label: "INSTRUTOR" },
    ],
    rows: [
      { nome: "Rec. Silva", turma: "T-05", fase: "Instrução básica", instrutor: "Instr. Martins" },
      { nome: "Rec. Costa", turma: "T-05", fase: "SAT pendente", instrutor: "Instr. Alves" },
    ],
  }),

  "efetivo-inativos": base("efetivo-inativos", {
    stats: [{ label: "Inativos / afastados", value: 6, color: C.olive }],
    columns: [
      { key: "nome", label: "NOME" },
      { key: "motivo", label: "MOTIVO" },
      { key: "desde", label: "DESDE", mono: true },
    ],
    rows: [
      { nome: "Ex-Sd. Pires", motivo: "Licença médica", desde: "01/05/2026" },
      { nome: "Ex-Cb. Nunes", motivo: "Transferência", desde: "20/04/2026" },
    ],
  }),

  "logs-admin": base("logs-admin", {
    variant: "logs",
    stats: [{ label: "Eventos (24h)", value: 48, color: C.olive }],
    columns: [
      { key: "hora", label: "HORA", mono: true },
      { key: "usuario", label: "OPERADOR" },
      { key: "acao", label: "AÇÃO" },
    ],
    rows: [
      { hora: "21:04", usuario: "Instrutor", acao: "Aprovou inscrição CMF-2026-044" },
      { hora: "20:51", usuario: "Comando", acao: "Emitiu comunicado operacional" },
      { hora: "19:30", usuario: "Instrutor", acao: "Alterou status — em análise" },
    ],
  }),

  "logs-discord": base("logs-discord", {
    variant: "logs",
    stats: [{ label: "Eventos Discord (24h)", value: 112, color: C.blue }],
    columns: [
      { key: "hora", label: "HORA", mono: true },
      { key: "tipo", label: "TIPO" },
      { key: "detalhe", label: "DETALHE" },
    ],
    rows: [
      { hora: "21:05", tipo: "Webhook", detalhe: "Notificação aprovação enviada" },
      { hora: "20:12", tipo: "Cargo", detalhe: "Sync recruta → Soldado" },
    ],
  }),

  "logs-ops": base("logs-ops", {
    variant: "logs",
    stats: [{ label: "Registros OP (7d)", value: 64, color: C.red }],
    columns: [
      { key: "hora", label: "HORA", mono: true },
      { key: "op", label: "OP" },
      { key: "evento", label: "EVENTO" },
    ],
    rows: [
      { hora: "21:00", op: "OP-2405-A", evento: "Início — Sentinela" },
      { hora: "20:45", op: "OP-2405-B", evento: "Patrulha Norte — checkpoint OK" },
    ],
  }),

  "logs-sistema": base("logs-sistema", {
    variant: "logs",
    stats: [{ label: "Auditoria (30d)", value: 203, color: C.olive }],
    columns: [
      { key: "data", label: "DATA", mono: true },
      { key: "componente", label: "COMPONENTE" },
      { key: "evento", label: "EVENTO" },
    ],
    rows: [
      { data: "19/05 18:00", componente: "API", evento: "Health check OK" },
      { data: "19/05 12:00", componente: "Supabase", evento: "Backup automático concluído" },
    ],
  }),

  "mapa-bases": {
    tag: "MAPA TÁTICO",
    title: "Bases",
    subtitle: "Bases no mapa tático.",
    variant: "map",
    mapMode: "bases",
    stats: [
      { label: "Bases CMF", value: 4, color: C.green },
      { label: "Postos avançados", value: 2, color: C.blue },
    ],
    columns: [
      { key: "base", label: "BASE" },
      { key: "coords", label: "COORD.", mono: true },
      { key: "status", label: "STATUS" },
    ],
    rows: [
      { base: "QG Fort Zancudo", coords: "X: -2356 Y: 3241", status: "Operacional" },
      { base: "FOB Paleto", coords: "X: -448 Y: 6012", status: "Operacional" },
      { base: "Posto Sandy", coords: "X: 1844 Y: 3689", status: "Reforço" },
    ],
    primaryAction: "Registrar base",
  },

  "mapa-ops": {
    tag: "MAPA TÁTICO",
    title: "Operações no mapa",
    subtitle: "Áreas de operação.",
    variant: "map",
    mapMode: "ops",
    stats: [{ label: "Áreas ativas", value: 3, color: C.red }],
    columns: [
      { key: "area", label: "ÁREA" },
      { key: "op", label: "OPERAÇÃO" },
      { key: "nivel", label: "RISCO" },
    ],
    rows: [
      { area: "Setor Norte", op: "Sentinela", nivel: "Alto" },
      { area: "Centro LS", op: "Escolta VIP", nivel: "Médio" },
    ],
    primaryAction: "Marcar área de OP",
  },

  "mapa-zonas": {
    tag: "MAPA TÁTICO",
    title: "Zonas vermelhas",
    subtitle: "Zonas de alto risco.",
    variant: "map",
    mapMode: "danger",
    stats: [{ label: "Zonas vermelhas", value: 5, color: C.red }],
    columns: [
      { key: "zona", label: "ZONA" },
      { key: "motivo", label: "MOTIVO" },
      { key: "desde", label: "DESDE", mono: true },
    ],
    rows: [
      { zona: "Grove Street", motivo: "Confronto facções", desde: "18/05" },
      { zona: "Porto LS", motivo: "Contrabando", desde: "17/05" },
    ],
    primaryAction: "Declarar zona vermelha",
  } as ModuleConfig & { mapMode?: string },

  "mapa-patrulhas": {
    tag: "MAPA TÁTICO",
    title: "Patrulhas no mapa",
    subtitle: "Rotas de patrulha.",
    variant: "map",
    mapMode: "patrol",
    stats: [{ label: "Rotas ativas", value: 3, color: C.blue }],
    columns: [
      { key: "rota", label: "ROTA", mono: true },
      { key: "setor", label: "SETOR" },
      { key: "viatura", label: "VIATURA" },
    ],
    rows: [
      { rota: "PTR-01", setor: "Norte", viatura: "Humvee 204" },
      { rota: "PTR-02", setor: "Sul", viatura: "Blindado 07" },
    ],
    primaryAction: "Programar patrulha",
  },

  "discord-webhooks": base("discord-webhooks", {
    variant: "discord",
    stats: [{ label: "Webhooks", value: 2, color: C.green }],
    primaryAction: "Novo webhook",
    columns: [
      { key: "nome", label: "CANAL" },
      { key: "uso", label: "USO" },
      { key: "status", label: "STATUS" },
    ],
    rows: [
      { nome: "Inscrições / Comunicados", uso: "Principal", status: "Ativo" },
      { nome: "Logs operacionais", uso: "Auditoria", status: "Ativo" },
    ],
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
    stats: [{ label: "Regras de sync", value: 8, color: C.blue }],
    primaryAction: "Nova regra de cargo",
    columns: [
      { key: "patente", label: "PATENTE RP" },
      { key: "cargo", label: "CARGO DISCORD" },
      { key: "auto", label: "AUTO" },
    ],
    rows: [
      { patente: "Recruta", cargo: "@Recruta", auto: "Sim" },
      { patente: "Soldado", cargo: "@Efetivo", auto: "Sim" },
      { patente: "Oficial", cargo: "@Oficiais", auto: "Sim" },
    ],
  }),

  "discord-logs": base("discord-logs", {
    variant: "logs",
    stats: [{ label: "Mensagens log (24h)", value: 89, color: C.blue }],
    columns: [
      { key: "hora", label: "HORA", mono: true },
      { key: "evento", label: "EVENTO" },
    ],
    rows: [
      { hora: "21:05", evento: "Webhook: embed comunicado" },
      { hora: "20:12", evento: "Member update — cargo Soldado" },
    ],
  }),

  "discord-sync": base("discord-sync", {
    variant: "discord",
    stats: [
      { label: "Última sync", value: "Há 12 min", color: C.green },
      { label: "Pendentes", value: 0, color: C.olive },
    ],
    columns: [
      { key: "item", label: "ITEM" },
      { key: "status", label: "STATUS" },
    ],
    rows: [
      { item: "Cargos por patente", status: "Sincronizado" },
      { item: "Nicknames CMF", status: "Sincronizado" },
    ],
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
    rows: [
      { tabela: "inscricoes", registros: "—", ultimo: "19/05 12:00" },
      { tabela: "auth.users", registros: "—", ultimo: "19/05 12:00" },
    ],
  }),

  "sys-api": base("sys-api", {
    variant: "system",
    stats: [{ label: "Endpoints", value: 12, color: C.olive }],
    columns: [
      { key: "rota", label: "ROTA", mono: true },
      { key: "metodo", label: "MÉTODO" },
      { key: "status", label: "STATUS" },
    ],
    rows: [
      { rota: "/api/inscricoes", metodo: "POST", status: "200 OK" },
      { rota: "/api/admin/stats", metodo: "POST", status: "200 OK" },
    ],
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
    rows: [{ inicio: "19/05 20:30", ip: "Sessão local", status: "Ativa" }],
  }),

  "sys-backup": base("sys-backup", {
    variant: "system",
    stats: [
      { label: "Último backup", value: "Hoje 12:00", color: C.green },
      { label: "Retenção", value: "30 dias", color: C.olive },
    ],
    columns: [
      { key: "id", label: "ID", mono: true },
      { key: "tipo", label: "TIPO" },
      { key: "tamanho", label: "TAMANHO" },
      { key: "data", label: "DATA", mono: true },
    ],
    rows: [
      { id: "BK-240519", tipo: "Completo", tamanho: "124 MB", data: "19/05 12:00" },
      { id: "BK-240518", tipo: "Completo", tamanho: "122 MB", data: "18/05 12:00" },
    ],
    primaryAction: "Executar backup",
  }),

  "agenda-treinos": base("agenda-treinos", {
    variant: "agenda",
    stats: [{ label: "Esta semana", value: 9, color: C.olive }],
    columns: [
      { key: "data", label: "DATA", mono: true },
      { key: "evento", label: "TREINO" },
      { key: "local", label: "LOCAL" },
    ],
    rows: [
      { data: "21/05 19:00", evento: "CQB Turma A", local: "Campo B" },
      { data: "22/05 18:00", evento: "SAT Turma 3", local: "Pista" },
    ],
    primaryAction: "Agendar treino",
  }),

  "agenda-ops": base("agenda-ops", {
    variant: "agenda",
    stats: [{ label: "OPs agendadas", value: 4, color: C.red }],
    primaryAction: "Agendar operação",
    columns: [
      { key: "data", label: "DATA", mono: true },
      { key: "op", label: "OPERAÇÃO" },
      { key: "comandante", label: "COMANDANTE" },
    ],
    rows: [
      { data: "20/05 18:00", op: "Escolta VIP", comandante: "Ten. Rocha" },
      { data: "22/05 20:00", op: "Operação Eclipse", comandante: "Cap. Mendes" },
    ],
  }),

  "agenda-entrevistas": base("agenda-entrevistas", {
    variant: "agenda",
    stats: [{ label: "Entrevistas", value: 8, color: C.blue }],
    columns: [
      { key: "data", label: "DATA", mono: true },
      { key: "candidato", label: "CANDIDATO" },
      { key: "instrutor", label: "INSTRUTOR" },
    ],
    rows: [
      { data: "20/05 17:00", candidato: "Rec. Novo #44", instrutor: "Instr. Martins" },
      { data: "21/05 16:30", candidato: "Rec. Novo #45", instrutor: "Instr. Alves" },
    ],
  }),

  "agenda-reunioes": base("agenda-reunioes", {
    variant: "agenda",
    stats: [{ label: "Reuniões", value: 2, color: C.olive }],
    primaryAction: "Agendar reunião",
    columns: [
      { key: "data", label: "DATA", mono: true },
      { key: "titulo", label: "TÍTULO" },
      { key: "participantes", label: "QUÓRUM" },
    ],
    rows: [
      { data: "23/05 20:00", titulo: "Conselho de comando", participantes: "Oficiais" },
      { data: "25/05 19:00", titulo: "Debrief OP Sentinela", participantes: "OP + S2" },
    ],
  }),

  "disc-advertencias": base("disc-advertencias", {
    stats: [{ label: "Advertências (mês)", value: 7, color: C.yellow }],
    columns: [
      { key: "militar", label: "MILITAR" },
      { key: "motivo", label: "MOTIVO" },
      { key: "grau", label: "GRAU" },
      { key: "data", label: "DATA", mono: true },
    ],
    rows: [
      { militar: "Sd. Ferreira", motivo: "Atraso formação", grau: "Leve", data: "15/05/2026" },
    ],
    primaryAction: "Registrar advertência",
  }),

  "disc-prisoes": base("disc-prisoes", {
    stats: [{ label: "Detidos", value: 1, color: C.red }],
    primaryAction: "Registrar prisão",
    columns: [
      { key: "militar", label: "MILITAR" },
      { key: "motivo", label: "MOTIVO" },
      { key: "tempo", label: "TEMPO RP" },
    ],
    rows: [{ militar: "Ex-Sd. Lima", motivo: "Desobediência OP", tempo: "48h" }],
  }),

  "disc-suspensoes": base("disc-suspensoes", {
    stats: [{ label: "Suspensões ativas", value: 2, color: C.yellow }],
    primaryAction: "Registrar suspensão",
    columns: [
      { key: "militar", label: "MILITAR" },
      { key: "ate", label: "ATÉ", mono: true },
      { key: "motivo", label: "MOTIVO" },
    ],
    rows: [
      { militar: "Cb. Santos", ate: "25/05/2026", motivo: "Conduta inadequada" },
    ],
  }),

  "disc-expulsoes": base("disc-expulsoes", {
    stats: [{ label: "Expulsões (ano)", value: 3, color: C.red }],
    primaryAction: "Registrar expulsão",
    columns: [
      { key: "militar", label: "MILITAR" },
      { key: "motivo", label: "MOTIVO" },
      { key: "data", label: "DATA", mono: true },
    ],
    rows: [
      { militar: "Ex-Rec. Vega", motivo: "Traição RP", data: "02/05/2026" },
    ],
  }),

  "disc-sindicancias": base("disc-sindicancias", {
    stats: [{ label: "Processos abertos", value: 1, color: C.blue }],
    columns: [
      { key: "proc", label: "PROCESSO", mono: true },
      { key: "acusado", label: "ACUSADO" },
      { key: "status", label: "STATUS" },
    ],
    rows: [
      { proc: "SIN-2026-03", acusado: "Identidade reservada", status: "Instrução" },
    ],
    primaryAction: "Abrir sindicância",
  }),

  "restrito-intel": base("restrito-intel", {
    classified: true,
    stats: [{ label: "Arquivos", value: 6, color: C.red }],
    primaryAction: "Novo documento",
    columns: [
      { key: "ref", label: "REF", mono: true },
      { key: "titulo", label: "TÍTULO" },
      { key: "nivel", label: "NÍVEL" },
    ],
    rows: [
      { ref: "R-INT-01", titulo: "Operação Fantasma", nivel: "Secreto" },
    ],
  }),

  "restrito-ops": base("restrito-ops", {
    classified: true,
    stats: [{ label: "OPs classificadas", value: 2, color: C.red }],
    primaryAction: "Nova OP sigilosa",
    columns: [
      { key: "codigo", label: "CÓDIGO", mono: true },
      { key: "nome", label: "NOME" },
      { key: "acesso", label: "ACESSO" },
    ],
    rows: [
      { codigo: "OP-CLS-01", nome: "Operação Eclipse", acesso: "Alto comando" },
    ],
  }),

  "restrito-docs": base("restrito-docs", {
    classified: true,
    stats: [{ label: "Documentos", value: 14, color: C.red }],
    primaryAction: "Novo documento interno",
    columns: [
      { key: "doc", label: "DOC", mono: true },
      { key: "titulo", label: "TÍTULO" },
      { key: "custodia", label: "CUSTÓDIA" },
    ],
    rows: [
      { doc: "INT-001", titulo: "Estatuto interno CMF", custodia: "Comando" },
    ],
  }),
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
