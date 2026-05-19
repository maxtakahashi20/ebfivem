import type { AdminView } from "@/config/admin-nav";

export const PENDING_VIEW_KEY = "eb_cmd_pending_view";
export const PENDING_DOC_PROTOCOLO_KEY = "eb_cmd_doc_protocolo";

export function queuePainelView(view: AdminView, extras?: { protocolo?: string }) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_VIEW_KEY, view);
  if (extras?.protocolo) {
    sessionStorage.setItem(PENDING_DOC_PROTOCOLO_KEY, extras.protocolo);
  }
}

export function consumePendingDocProtocolo(): string | null {
  if (typeof window === "undefined") return null;
  const p = sessionStorage.getItem(PENDING_DOC_PROTOCOLO_KEY);
  sessionStorage.removeItem(PENDING_DOC_PROTOCOLO_KEY);
  return p;
}

export function goToPainel(view: AdminView = "perfil", extras?: { protocolo?: string }) {
  queuePainelView(view, extras);
  window.location.assign("/ADMCMF");
}
