import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, LogOut } from "lucide-react";
import logo from "@/assets/logo-2de.png";
import { motion } from "framer-motion";
import { useDiscordSession } from "@/hooks/useDiscordSession";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { papelAlcanca } from "@/lib/access-control";
import { getPainelStatus } from "@/lib/admin.functions";
import { getDiscordSessionToken } from "@/lib/painel-auth-storage";
import {
  type AdminView,
  NAV_ENTRIES,
  type NavEntry,
  papelDaView,
} from "@/config/admin-nav";

type Props = {
  view: AdminView;
  onViewChange: (v: AdminView) => void;
  onLogout: () => void;
};

function isGroupActive(groupId: string, view: AdminView, entry: NavEntry): boolean {
  if (entry.type !== "group" || entry.group.id !== groupId) return false;
  return entry.group.children.some((c) => c.id === view);
}

export function AdminSidebar({ view, onViewChange, onLogout }: Props) {
  const fetchStatus = useServerFn(getPainelStatus);
  const { papel, desenvolvedor, pe, profile } = useDiscordSession();
  const [status, setStatus] = useState({
    bot: false,
    webhook: false,
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const e of NAV_ENTRIES) {
      if (e.type === "group") {
        init[e.group.id] = !!e.group.defaultOpen;
      }
    }
    return init;
  });

  const visibleEntries = useMemo<NavEntry[]>(() => {
    // A PE é por cargo próprio, fora da escada de papéis; o servidor confere de novo.
    const pode = (id: string) => (id.startsWith("pe-") ? pe : papelAlcanca(papel, papelDaView(id)));
    return NAV_ENTRIES.flatMap((entry) => {
      if (entry.type === "single") return pode(entry.id) ? [entry] : [];
      const children = entry.group.children.filter((c) => pode(c.id));
      if (children.length === 0) return [];
      return [{ type: "group" as const, group: { ...entry.group, children } }];
    });
  }, [papel, pe]);

  useEffect(() => {
    fetchStatus({ data: { session: getDiscordSessionToken() } })
      .then(setStatus)
      .catch(() => {});
  }, [fetchStatus]);

  useEffect(() => {
    for (const e of NAV_ENTRIES) {
      if (e.type === "group" && e.group.children.some((c) => c.id === view)) {
        setOpenGroups((prev) => ({ ...prev, [e.group.id]: true }));
      }
    }
  }, [view]);

  const nome = profile?.nick || profile?.displayName || profile?.username || "Militar";
  const papelLabel = desenvolvedor ? "DESENVOLVEDOR" : (PAPEL_LABEL[papel ?? "membro"] ?? "MEMBRO");

  const btnBase =
    "text-[14px] h-9.5 py-2 group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 adm-nav-btn";
  const btnActive = "adm-nav-active text-foreground";
  const btnIdle = "text-muted-foreground hover:text-foreground";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-(--color-khaki) adm-nav-sidebar"
    >
      <SidebarHeader className="border-b border-border p-0">
        <div className="flex h-16 items-center gap-3 px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <img src={logo} alt="2ª DE" className="size-9 shrink-0 object-contain" />
          <div className="min-w-0 overflow-hidden group-data-[collapsible=icon]:hidden">
            <div className="font-display text-base font-semibold tracking-[0.12em] leading-tight text-[#d9d2b5]">
              PAINEL 2ª DE
            </div>
            <div className="font-mono text-[9px] tracking-[0.12em] text-(--color-olive-bright)">COMANDO · INSTRUTORES</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="adm-nav-scroll">
        <SidebarGroup className="px-2 pt-4 pb-2 group-data-[collapsible=icon]:px-1.5">
          <SidebarGroupLabel className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground/70 mb-2 px-2 adm-nav-section-label">
            NAVEGAÇÃO
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {visibleEntries.map((entry, idx) => {
                if (entry.type === "single") {
                  const Icon = entry.icon;
                  const active = view === entry.id;
                  const war = entry.highlight === "war";
                  return (
                    <SidebarMenuItem
                      key={entry.id}
                      className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                    >
                      {idx === 1 && (
                        <div
                          role="separator"
                          className="adm-nav-sep my-2 group-data-[collapsible=icon]:hidden"
                        />
                      )}
                      <SidebarMenuButton
                        tooltip={entry.label}
                        isActive={active}
                        onClick={() => onViewChange(entry.id)}
                        className={`${btnBase} ${active ? btnActive : btnIdle} ${
                          war ? "adm-nav-war" : ""
                        }`}
                      >
                        <motion.span
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          className="inline-flex shrink-0"
                        >
                          <Icon className="size-[17px] shrink-0" />
                        </motion.span>
                        <span className="group-data-[collapsible=icon]:hidden">{entry.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                const g = entry.group;
                const Icon = g.icon;
                const open = openGroups[g.id] ?? false;
                const groupActive = isGroupActive(g.id, view, entry);

                return (
                  <Collapsible
                    key={g.id}
                    open={open}
                    onOpenChange={(o) => setOpenGroups((prev) => ({ ...prev, [g.id]: o }))}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={g.label}
                          className={`${btnBase} w-full ${groupActive ? "text-foreground" : btnIdle}`}
                        >
                          <Icon className="size-[17px] shrink-0" />
                          <span className="flex-1 text-left">{g.label}</span>
                          <ChevronRight
                            className={`size-3.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="adm-nav-sub border-l border-border ml-4 pl-2">
                          {g.children.map((child) => {
                            const childActive = view === child.id;
                            return (
                              <SidebarMenuSubItem key={child.id}>
                                <SidebarMenuSubButton
                                  isActive={childActive}
                                  onClick={() => onViewChange(child.id)}
                                  className={`text-[13px] py-1.5 ${childActive ? "adm-nav-sub-active" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                  
                                  {child.label}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3 group-data-[collapsible=icon]:px-1.5 gap-3">
        <div className="adm-nav-status space-y-1 px-1 group-data-[collapsible=icon]:hidden">
          {desenvolvedor && (
            <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-(--color-destructive) mb-1">
              <span className="size-1.5 rounded-full bg-(--color-destructive)" />
              MODO DESENVOLVEDOR
            </div>
          )}
          <StatusDot ok={status.bot} label={status.bot ? "BOT CONFIGURADO" : "BOT AUSENTE"} />
          <StatusDot ok={status.webhook} label={status.webhook ? "WEBHOOK CONFIGURADO" : "WEBHOOK AUSENTE"} />
        </div>

        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="size-9 shrink-0 rounded-full object-cover group-data-[collapsible=icon]:hidden" />
          ) : (
            <span className="size-9 shrink-0 rounded-full bg-(--color-olive) flex items-center justify-center font-display text-[13px] text-[#d9d2b5] group-data-[collapsible=icon]:hidden">
              {nome.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm text-foreground">{nome}</div>
            <div className="font-mono text-[10px] tracking-wider text-(--color-gold)">{papelLabel}</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Encerrar sessão"
            aria-label="Encerrar sessão"
            className="size-8 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

const PAPEL_LABEL: Record<string, string> = {
  membro: "MEMBRO",
  instrutor: "INSTRUTOR",
  "alto-comando": "ALTO COMANDO",
  desenvolvedor: "DESENVOLVEDOR",
};

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] tracking-wide text-muted-foreground">
      <span className={`size-1.5 rounded-full shrink-0 ${ok ? "bg-[#7fbf6a]" : "bg-[#d4a94a]"}`} />
      {label}
    </div>
  );
}
