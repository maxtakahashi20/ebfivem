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

/** A tela pode montar mais de uma vez: o protocolo só sai da fila depois de usado. */
export function pendingDocProtocolo(): string | null {
  return sessionStorage.getItem(PENDING_DOC_PROTOCOLO_KEY);
}

export function limparPendingDocProtocolo() {
  sessionStorage.removeItem(PENDING_DOC_PROTOCOLO_KEY);
}

export function goToPainel(view: AdminView = "perfil", extras?: { protocolo?: string }) {
  queuePainelView(view, extras);
  window.location.assign("/painel");
}
