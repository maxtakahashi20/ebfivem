import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ChevronRight,
  LogOut,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
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
import { getPainelStatus } from "@/lib/admin.functions";
import {
  type AdminView,
  NAV_ENTRIES,
  type NavEntry,
} from "@/config/admin-nav";

type Props = {
  view: AdminView;
  onViewChange: (v: AdminView) => void;
  accessKey: string;
  onLogout: () => void;
};

function isGroupActive(groupId: string, view: AdminView, entry: NavEntry): boolean {
  if (entry.type !== "group" || entry.group.id !== groupId) return false;
  return entry.group.children.some((c) => c.id === view);
}

export function AdminSidebar({ view, onViewChange, accessKey, onLogout }: Props) {
  const fetchStatus = useServerFn(getPainelStatus);
  const { altoComando, desenvolvedor } = useDiscordSession();
  const [status, setStatus] = useState({
    sistema: true,
    discord: false,
    api: false,
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
    return NAV_ENTRIES.flatMap((entry) => {
      if (entry.type === "single") {
        if (entry.restricted === "alto-comando" && !altoComando) return [];
        return [entry];
      }
      const g = entry.group;
      if (g.restricted === "alto-comando" && !altoComando) return [];
      const children = g.children.filter(
        (c) => !(c.restricted === "alto-comando" && !altoComando),
      );
      if (children.length === 0) return [];
      return [{ type: "group" as const, group: { ...g, children } }];
    });
  }, [altoComando]);

  useEffect(() => {
    fetchStatus({ data: { accessKey } })
      .then(setStatus)
      .catch(() => {});
  }, [accessKey, fetchStatus]);

  useEffect(() => {
    for (const e of NAV_ENTRIES) {
      if (e.type === "group" && e.group.children.some((c) => c.id === view)) {
        setOpenGroups((prev) => ({ ...prev, [e.group.id]: true }));
      }
    }
  }, [view]);

  const btnBase =
    "font-display tracking-widest text-xs py-2 group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 adm-nav-btn";
  const btnActive =
    "bg-(--color-olive-deep) text-(--color-khaki) hover:bg-(--color-olive-deep) hover:text-(--color-khaki) adm-nav-active";
  const btnIdle =
    "text-(--color-stencil) hover:bg-olive-deep/10 hover:text-(--color-olive-deep)";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-2 border-(--color-olive-deep) bg-(--color-khaki) adm-nav-sidebar"
    >
      <SidebarHeader className="border-b border-olive-deep/15 p-0">
        <div className="flex h-14 items-center gap-2 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <Shield className="size-5 shrink-0 text-(--color-olive-deep)" />
          <div className="min-w-0 overflow-hidden group-data-[collapsible=icon]:hidden">
            <div className="stencil text-[9px] leading-none">PAINEL DE INSTRUTORES</div>
            <div className="font-display text-sm leading-tight tracking-widest text-(--color-olive-deep)">
              CMF · COMANDO
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="adm-nav-scroll">
        <SidebarGroup className="px-2 pt-4 pb-2 group-data-[collapsible=icon]:px-1.5">
          <SidebarGroupLabel className="stencil text-[9px] mb-2 px-1 adm-nav-section-label">
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
                          war ? "adm-nav-war border border-destructive/40" : ""
                        }`}
                      >
                        <motion.span
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          className="inline-flex shrink-0"
                        >
                          <Icon className="size-4 shrink-0" />
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
                          className={`${btnBase} w-full ${groupActive ? "text-(--color-olive-deep) font-semibold" : btnIdle}`}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="flex-1 text-left">{g.label}</span>
                          <ChevronRight
                            className={`size-3.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="adm-nav-sub border-l-2 border-olive-deep/25 ml-3 pl-2">
                          {g.children.map((child) => {
                            const childActive = view === child.id;
                            return (
                              <SidebarMenuSubItem key={child.id}>
                                <SidebarMenuSubButton
                                  isActive={childActive}
                                  onClick={() => onViewChange(child.id)}
                                  className={`text-[11px] font-display tracking-wider py-1.5 ${
                                    childActive ? "adm-nav-sub-active" : ""
                                  }`}
                                >
                                  <span className="adm-nav-tree">├</span>
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

      <SidebarFooter className="border-t border-olive-deep/15 p-2 group-data-[collapsible=icon]:px-1.5 space-y-2">
        <div className="adm-nav-status space-y-1 px-1 group-data-[collapsible=icon]:hidden">
          {desenvolvedor && (
            <div className="flex items-center gap-1.5 text-[9px] font-display tracking-widest text-(--color-destructive) mb-1">
              <span className="size-1.5 rounded-full bg-(--color-destructive) shadow-[0_0_6px_rgba(220,38,38,0.6)]" />
              MODO DESENVOLVEDOR
            </div>
          )}
          <StatusDot ok={status.sistema} label="SISTEMA OPERACIONAL" />
          <StatusDot ok={status.discord} label="DISCORD ONLINE" />
          <StatusDot ok={status.api} label="API ONLINE" />
          <StatusDot ok={status.webhook} label="WEBHOOK ATIVO" />
        </div>

        <SidebarMenu className="gap-2">
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <div className="flex w-full items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <AdminThemeToggle compact className="group-data-[collapsible=icon]:mx-auto" />
              <span className="stencil text-[8px] text-(--color-stencil) group-data-[collapsible=icon]:hidden">
                TEMA
              </span>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              tooltip="Encerrar sessão"
              onClick={onLogout}
              className={`${btnBase} ${btnIdle}`}
            >
              <LogOut className="size-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Encerrar sessão</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-mono tracking-wide text-(--color-stencil)">
      <span
        className={`size-1.5 rounded-full shrink-0 ${ok ? "bg-green-600 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-yellow-500"}`}
      />
      {label}
    </div>
  );
}
