import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Radar,
  UserPlus,
  Crosshair,
  GraduationCap,
  ScrollText,
  Users,
  Bot,
  Eye,
  Gavel,
  Calendar,
  Radio,
  Map,
  Medal,
  Settings,
  Lock,
  UserCircle,
  FileText,
} from "lucide-react";

export type AdminView = string;

export type NavLeaf = {
  id: AdminView;
  label: string;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  children: NavLeaf[];
};

export type NavSingle = {
  type: "single";
  id: AdminView;
  label: string;
  icon: LucideIcon;
  highlight?: "war" | "default";
};

export type NavGroupEntry = {
  type: "group";
  group: NavGroup;
};

export type NavEntry = NavSingle | NavGroupEntry;

/** Rotas com implementação real (resto = placeholder). */
export const IMPLEMENTED_VIEWS = new Set<AdminView>([
  "dashboard",
  "perfil",
  "central-guerra",
  "recrutamento-inscricoes",
  "recrutamento-aprovados",
  "recrutamento-reprovados",
  "recrutamento-analise",
  "comunicados",
  "documentos",
]);

const PLACEHOLDER_COPY: Record<string, { title: string; desc: string; tag?: string }> = {
  "recrutamento-entrevistas": {
    title: "Entrevistas",
    desc: "Agenda e controle de entrevistas com recrutas.",
    tag: "RECRUTAMENTO",
  },
  "ops-ativas": { title: "Operações ativas", desc: "Missões em andamento e status operacional.", tag: "OPERAÇÕES" },
  "ops-historico": { title: "Histórico operacional", desc: "Registro de operações concluídas.", tag: "OPERAÇÕES" },
  "ops-briefings": { title: "Briefings", desc: "Documentos e briefings de missão.", tag: "OPERAÇÕES" },
  "ops-missoes": { title: "Missões", desc: "Cadastro e gestão de missões.", tag: "OPERAÇÕES" },
  "ops-patrulhas": { title: "Patrulhas", desc: "Rotas e patrulhas programadas.", tag: "OPERAÇÕES" },
  "treino-sat": { title: "SAT", desc: "Seleção e avaliação SAT.", tag: "TREINAMENTOS" },
  "treino-cqb": { title: "CQB", desc: "Treinamento close quarters battle.", tag: "TREINAMENTOS" },
  "treino-taf": { title: "TAF", desc: "Teste de aptidão física.", tag: "TREINAMENTOS" },
  "treino-cursos": { title: "Cursos", desc: "Catálogo de cursos militares.", tag: "TREINAMENTOS" },
  "treino-presenca": { title: "Presença", desc: "Controle de presença em treinos.", tag: "TREINAMENTOS" },
  "treino-instrutores": { title: "Instrutores", desc: "Escala de instrutores.", tag: "TREINAMENTOS" },
  "com-avisos": { title: "Avisos", desc: "Avisos gerais ao efetivo.", tag: "COMUNICAÇÃO" },
  "com-alertas": { title: "Alertas", desc: "Alertas operacionais prioritários.", tag: "COMUNICAÇÃO" },
  "com-defcon": { title: "DEFCON", desc: "Nível de alerta da unidade.", tag: "COMUNICAÇÃO" },
  "com-emergencia": { title: "Emergência", desc: "Comunicados de emergência.", tag: "COMUNICAÇÃO" },
  "com-broadcast": { title: "Broadcast", desc: "Transmissão em massa.", tag: "COMUNICAÇÃO" },
  "intel-relatorios": { title: "Relatórios", desc: "Relatórios de inteligência.", tag: "INTELIGÊNCIA" },
  "intel-investigacao": { title: "Investigação", desc: "Casos em investigação.", tag: "INTELIGÊNCIA" },
  "intel-suspeitos": { title: "Suspeitos", desc: "Base de suspeitos monitorados.", tag: "INTELIGÊNCIA" },
  "intel-blacklist": { title: "Blacklist", desc: "Lista restritiva de indivíduos.", tag: "INTELIGÊNCIA" },
  "intel-sigilosos": { title: "Documentos sigilosos", desc: "Acesso ultra restrito.", tag: "INTELIGÊNCIA" },
  "mil-patentes": { title: "Patentes", desc: "Hierarquia e patentes.", tag: "SISTEMA MILITAR" },
  "mil-medalhas": { title: "Medalhas", desc: "Condecorações e medalhas.", tag: "SISTEMA MILITAR" },
  "mil-promocoes": { title: "Promoções", desc: "Histórico de promoções.", tag: "SISTEMA MILITAR" },
  "mil-honrarias": { title: "Honrarias", desc: "Honras ao mérito.", tag: "SISTEMA MILITAR" },
  "efetivo-ativos": {
    title: "Militares",
    desc: "Membros autenticados no Discord (inclusão automática).",
    tag: "EFETIVO",
  },
  "efetivo-instrutores": { title: "Instrutores", desc: "Corpo de instrução.", tag: "EFETIVO" },
  "logs-admin": { title: "Logs administrativos", desc: "Ações no painel.", tag: "LOGS" },
  "logs-discord": { title: "Logs Discord", desc: "Eventos do Discord.", tag: "LOGS" },
  "logs-ops": { title: "Logs operacionais", desc: "Registro de operações.", tag: "LOGS" },
  "logs-sistema": { title: "Alterações do sistema", desc: "Auditoria técnica.", tag: "LOGS" },
  "mapa-bases": { title: "Bases", desc: "Bases no mapa tático.", tag: "MAPA TÁTICO" },
  "mapa-ops": { title: "Operações no mapa", desc: "Áreas de operação.", tag: "MAPA TÁTICO" },
  "mapa-zonas": { title: "Zonas vermelhas", desc: "Zonas de alto risco.", tag: "MAPA TÁTICO" },
  "mapa-patrulhas": { title: "Patrulhas no mapa", desc: "Rotas de patrulha.", tag: "MAPA TÁTICO" },
  "discord-webhooks": { title: "Webhooks", desc: "Configuração de webhooks.", tag: "DISCORD" },
  "discord-bot": { title: "Status do bot", desc: "Integração com bot oficial.", tag: "DISCORD" },
  "discord-cargos": { title: "Cargos automáticos", desc: "Sincronização de cargos.", tag: "DISCORD" },
  "discord-logs": { title: "Logs Discord", desc: "Canal de logs.", tag: "DISCORD" },
  "discord-sync": { title: "Sincronização", desc: "Sync painel ↔ Discord.", tag: "DISCORD" },
  "sys-db": { title: "Banco de dados", desc: "Status Supabase.", tag: "SISTEMA" },
  "sys-api": { title: "API", desc: "Endpoints e integrações.", tag: "SISTEMA" },
  "sys-seguranca": { title: "Segurança", desc: "Chaves e permissões.", tag: "SISTEMA" },
  "sys-sessoes": { title: "Sessões", desc: "Sessões administrativas.", tag: "SISTEMA" },
  "sys-backup": { title: "Backup", desc: "Rotinas de backup.", tag: "SISTEMA" },
  "agenda-treinos": { title: "Treinamentos", desc: "Calendário de treinos.", tag: "AGENDA" },
  "agenda-ops": { title: "Operações", desc: "Operações agendadas.", tag: "AGENDA" },
  "agenda-entrevistas": { title: "Entrevistas", desc: "Entrevistas marcadas.", tag: "AGENDA" },
  "agenda-reunioes": { title: "Reuniões", desc: "Reuniões de comando.", tag: "AGENDA" },
  "disc-advertencias": { title: "Advertências", desc: "Registro disciplinar.", tag: "DISCIPLINA" },
  "disc-prisoes": { title: "Prisões", desc: "Detenções e prisões RP.", tag: "DISCIPLINA" },
  "disc-suspensoes": { title: "Suspensões", desc: "Suspensões temporárias.", tag: "DISCIPLINA" },
  "disc-expulsoes": { title: "Expulsões", desc: "Expulsões do quadro.", tag: "DISCIPLINA" },
  "disc-sindicancias": { title: "Sindicâncias", desc: "Processos disciplinares.", tag: "DISCIPLINA" },
  "restrito-intel": { title: "Inteligência restrita", desc: "Somente alto comando.", tag: "RESTRITO" },
  "restrito-ops": { title: "Operações sigilosas", desc: "Classificado.", tag: "RESTRITO" },
  "restrito-docs": { title: "Documentos internos", desc: "Arquivo restrito.", tag: "RESTRITO" },
};

export function getPlaceholderMeta(view: AdminView) {
  return (
    PLACEHOLDER_COPY[view] ?? {
      title: view,
      desc: "Módulo em desenvolvimento para a intranet CMF.",
      tag: "COMANDO",
    }
  );
}

const VIEW_LABELS: Record<string, string> = {};
function registerLabels(entries: NavEntry[]) {
  for (const e of entries) {
    if (e.type === "single") VIEW_LABELS[e.id] = e.label;
    else for (const c of e.group.children) VIEW_LABELS[c.id] = `${e.group.label} · ${c.label}`;
  }
}

export function getViewLabel(view: AdminView): string {
  return VIEW_LABELS[view] ?? "Painel";
}

export function buildViewLabels(entries: NavEntry[]) {
  registerLabels(entries);
}

export const NAV_ENTRIES: NavEntry[] = [
  { type: "single", id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { type: "single", id: "perfil", label: "Identidade", icon: UserCircle },
  { type: "single", id: "documentos", label: "Documentos", icon: FileText },
  {
    type: "single",
    id: "central-guerra",
    label: "Central de Guerra",
    icon: Radar,
    highlight: "war",
  },
  {
    type: "group",
    group: {
      id: "recrutamento",
      label: "Recrutamento",
      icon: UserPlus,
      defaultOpen: true,
      children: [
        { id: "recrutamento-inscricoes", label: "Inscrições" },
        { id: "recrutamento-entrevistas", label: "Entrevistas" },
        { id: "recrutamento-aprovados", label: "Aprovados" },
        { id: "recrutamento-reprovados", label: "Reprovados" },
        { id: "recrutamento-analise", label: "Em análise" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "operacoes",
      label: "Operações",
      icon: Crosshair,
      children: [
        { id: "ops-ativas", label: "Operações ativas" },
        { id: "ops-historico", label: "Histórico operacional" },
        { id: "ops-briefings", label: "Briefings" },
        { id: "ops-missoes", label: "Missões" },
        { id: "ops-patrulhas", label: "Patrulhas" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "treinamentos",
      label: "Treinamentos",
      icon: GraduationCap,
      children: [
        { id: "treino-sat", label: "SAT" },
        { id: "treino-cqb", label: "CQB" },
        { id: "treino-taf", label: "TAF" },
        { id: "treino-cursos", label: "Cursos" },
        { id: "treino-presenca", label: "Presença" },
        { id: "treino-instrutores", label: "Instrutores" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "logs",
      label: "Central de Logs",
      icon: ScrollText,
      children: [
        { id: "logs-admin", label: "Logs administrativos" },
        { id: "logs-discord", label: "Logs Discord" },
        { id: "logs-ops", label: "Logs operacionais" },
        { id: "logs-sistema", label: "Alterações do sistema" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "efetivo",
      label: "Efetivo Militar",
      icon: Users,
      children: [
        { id: "efetivo-ativos", label: "Militares" },
        { id: "efetivo-instrutores", label: "Instrutores" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "discord",
      label: "Discord",
      icon: Bot,
      children: [
        { id: "discord-webhooks", label: "Webhooks" },
        { id: "discord-bot", label: "Status do bot" },
        { id: "discord-cargos", label: "Cargos automáticos" },
        { id: "discord-logs", label: "Logs" },
        { id: "discord-sync", label: "Sincronização" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "inteligencia",
      label: "Inteligência",
      icon: Eye,
      children: [
        { id: "intel-relatorios", label: "Relatórios" },
        { id: "intel-investigacao", label: "Investigação" },
        { id: "intel-suspeitos", label: "Suspeitos" },
        { id: "intel-blacklist", label: "Blacklist" },
        { id: "intel-sigilosos", label: "Documentos sigilosos" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "disciplina",
      label: "Central Disciplinar",
      icon: Gavel,
      children: [
        { id: "disc-advertencias", label: "Advertências" },
        { id: "disc-prisoes", label: "Prisões" },
        { id: "disc-suspensoes", label: "Suspensões" },
        { id: "disc-expulsoes", label: "Expulsões" },
        { id: "disc-sindicancias", label: "Sindicâncias" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "agenda",
      label: "Agenda Operacional",
      icon: Calendar,
      children: [
        { id: "agenda-treinos", label: "Treinamentos" },
        { id: "agenda-ops", label: "Operações" },
        { id: "agenda-entrevistas", label: "Entrevistas" },
        { id: "agenda-reunioes", label: "Reuniões" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "comunicacao",
      label: "Central de Comunicação",
      icon: Radio,
      children: [
        { id: "comunicados", label: "Comunicados" },
        { id: "com-avisos", label: "Avisos" },
        { id: "com-alertas", label: "Alertas" },
        { id: "com-defcon", label: "DEFCON" },
        { id: "com-emergencia", label: "Emergência" },
        { id: "com-broadcast", label: "Broadcast" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "mapa",
      label: "Mapa Tático",
      icon: Map,
      children: [
        { id: "mapa-bases", label: "Bases" },
        { id: "mapa-ops", label: "Operações" },
        { id: "mapa-zonas", label: "Zonas vermelhas" },
        { id: "mapa-patrulhas", label: "Patrulhas" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "sistema-militar",
      label: "Sistema Militar",
      icon: Medal,
      children: [
        { id: "mil-patentes", label: "Patentes" },
        { id: "mil-medalhas", label: "Medalhas" },
        { id: "mil-promocoes", label: "Promoções" },
        { id: "mil-honrarias", label: "Honrarias" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "sistema",
      label: "Sistema",
      icon: Settings,
      children: [
        { id: "sys-db", label: "Banco de dados" },
        { id: "sys-api", label: "API" },
        { id: "sys-seguranca", label: "Segurança" },
        { id: "sys-sessoes", label: "Sessões" },
        { id: "sys-backup", label: "Backup" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "restrito",
      label: "Área Restrita",
      icon: Lock,
      children: [
        { id: "restrito-intel", label: "Inteligência" },
        { id: "restrito-ops", label: "Operações sigilosas" },
        { id: "restrito-docs", label: "Documentos internos" },
      ],
    },
  },
];

buildViewLabels(NAV_ENTRIES);
