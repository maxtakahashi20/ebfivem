import type { LucideIcon } from "lucide-react";
import type { Papel } from "@/lib/access-control";
import {
  LayoutDashboard,
  Radar,
  UserPlus,
  Crosshair,
  ScrollText,
  Users,
  Bot,
  Eye,
  Gavel,
  Radio,
  Settings,
  Lock,
  UserCircle,
  FileText,
  LifeBuoy,
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
  "suporte-admin",
]);

const VIEWS_MEMBRO = new Set<AdminView>(["dashboard", "perfil", "documentos"]);

/** Quem pode abrir cada tela. O que não estiver listado é do Alto Comando. */
export function papelDaView(view: AdminView): Papel {
  if (VIEWS_MEMBRO.has(view)) return "membro";
  return view.startsWith("recrutamento-") ? "instrutor" : "alto-comando";
}

const PLACEHOLDER_COPY: Record<string, { title: string; desc: string; tag?: string }> = {
  "recrutamento-entrevistas": {
    title: "Entrevistas",
    desc: "Agenda e controle de entrevistas com recrutas.",
    tag: "RECRUTAMENTO",
  },
  "ops-ativas": {
    title: "Operações ativas",
    desc: "Missões em andamento e status operacional.",
    tag: "OPERAÇÕES",
  },
  "efetivo-ativos": {
    title: "Militares",
    desc: "Membros autenticados no Discord (inclusão automática).",
    tag: "EFETIVO",
  },
  "efetivo-instrutores": { title: "Instrutores", desc: "Corpo de instrução.", tag: "EFETIVO" },
  "logs-geral": { title: "Logs em geral", desc: "Eventos auditados do painel, Discord, operações e sistema.", tag: "LOGS" },
  "discord-webhooks": { title: "Webhooks", desc: "Configuração de webhooks.", tag: "DISCORD" },
  "discord-bot": { title: "Status do bot", desc: "Integração com bot oficial.", tag: "DISCORD" },
  "discord-cargos": { title: "Cargos automáticos", desc: "Sincronização de cargos.", tag: "DISCORD" },
  "discord-logs": { title: "Logs Discord", desc: "Canal de logs.", tag: "DISCORD" },
  "discord-sync": { title: "Sincronização", desc: "Sync painel ↔ Discord.", tag: "DISCORD" },
  "intel-relatorios": { title: "Relatórios", desc: "Relatórios de inteligência.", tag: "INTELIGÊNCIA" },
  "intel-investigacao": { title: "Investigação", desc: "Casos em investigação.", tag: "INTELIGÊNCIA" },
  "intel-suspeitos": { title: "Suspeitos", desc: "Base de suspeitos monitorados.", tag: "INTELIGÊNCIA" },
  "intel-blacklist": { title: "Blacklist", desc: "Lista restritiva de indivíduos.", tag: "INTELIGÊNCIA" },
  "intel-sigilosos": { title: "Documentos sigilosos", desc: "Acesso ultra restrito.", tag: "INTELIGÊNCIA" },
  "disc-advertencias": { title: "Advertências", desc: "Registro disciplinar.", tag: "DISCIPLINA" },
  "disc-prisoes": { title: "Prisões", desc: "Detenções e prisões RP.", tag: "DISCIPLINA" },
  "disc-suspensoes": { title: "Suspensões", desc: "Suspensões temporárias.", tag: "DISCIPLINA" },
  "disc-expulsoes": { title: "Expulsões", desc: "Expulsões do quadro.", tag: "DISCIPLINA" },
  "disc-sindicancias": { title: "Sindicâncias", desc: "Processos disciplinares.", tag: "DISCIPLINA" },
  "sys-db": { title: "Banco de dados", desc: "Status Supabase.", tag: "SISTEMA" },
  "sys-api": { title: "API", desc: "Endpoints e integrações.", tag: "SISTEMA" },
  "sys-seguranca": { title: "Segurança", desc: "Chaves e permissões.", tag: "SISTEMA" },
  "sys-sessoes": { title: "Sessões", desc: "Sessões administrativas.", tag: "SISTEMA" },
  "sys-backup": { title: "Backup", desc: "Rotinas de backup.", tag: "SISTEMA" },
  "restrito-intel": { title: "Inteligência restrita", desc: "Somente alto comando.", tag: "RESTRITO" },
  "restrito-ops": { title: "Operações sigilosas", desc: "Classificado.", tag: "RESTRITO" },
  "restrito-docs": { title: "Documentos internos", desc: "Arquivo restrito.", tag: "RESTRITO" },
  "suporte-admin": {
    title: "Suporte",
    desc: "Atendimento de conscritos via chat ao vivo.",
    tag: "SUPORTE",
  },
};

export function getPlaceholderMeta(view: AdminView) {
  return (
    PLACEHOLDER_COPY[view] ?? {
      title: view,
      desc: "Módulo em desenvolvimento para a intranet 2ª DE.",
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
    type: "single",
    id: "suporte-admin",
    label: "Suporte",
    icon: LifeBuoy,
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
      ],
    },
  },
  {
    type: "single",
    id: "logs-geral",
    label: "Logs em geral",
    icon: ScrollText,
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
      id: "comunicacao",
      label: "Central de Comunicação",
      icon: Radio,
      children: [
        { id: "comunicados", label: "Comunicados" },
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
