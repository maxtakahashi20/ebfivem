import type { AdminView } from "@/config/admin-nav";

export const PENDING_VIEW_KEY = "eb_cmd_pending_view";
export const PENDING_DOC_PROTOCOLO_KEY = "eb_cmd_doc_protocolo";
export const PENDING_DOC_RG_KEY = "eb_cmd_doc_rg";

export function queuePainelView(view: AdminView, extras?: { protocolo?: string; rg?: string }) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_VIEW_KEY, view);
  if (extras?.protocolo) {
    sessionStorage.setItem(PENDING_DOC_PROTOCOLO_KEY, extras.protocolo);
    // Protocolo e RG andam juntos: um RG de visita anterior não pode valer para outro protocolo.
    if (extras.rg) sessionStorage.setItem(PENDING_DOC_RG_KEY, extras.rg);
    else sessionStorage.removeItem(PENDING_DOC_RG_KEY);
  }
}

/** A tela pode montar mais de uma vez: o protocolo só sai da fila depois de usado. */
export function pendingDocProtocolo(): string | null {
  return sessionStorage.getItem(PENDING_DOC_PROTOCOLO_KEY);
}

/** RG que veio junto de /acompanhar: prova de dono da ficha, sem precisar ser instrutor. */
export function pendingDocRg(): string | null {
  return sessionStorage.getItem(PENDING_DOC_RG_KEY);
}

export function limparPendingDocProtocolo() {
  sessionStorage.removeItem(PENDING_DOC_PROTOCOLO_KEY);
  sessionStorage.removeItem(PENDING_DOC_RG_KEY);
}

export function goToPainel(
  view: AdminView = "perfil",
  extras?: { protocolo?: string; rg?: string },
) {
  queuePainelView(view, extras);
  window.location.assign("/painel");
}
