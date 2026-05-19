/** Chave do painel /ADMCMF — persiste no localStorage (não some ao fechar o navegador). */
export const PANEL_ACCESS_KEY_STORAGE = "eb_cmd_key";

export function getPanelAccessKey(): string | null {
  if (typeof window === "undefined") return null;
  const fromLocal = localStorage.getItem(PANEL_ACCESS_KEY_STORAGE);
  if (fromLocal) return fromLocal;
  const legacy = sessionStorage.getItem(PANEL_ACCESS_KEY_STORAGE);
  if (legacy) {
    localStorage.setItem(PANEL_ACCESS_KEY_STORAGE, legacy);
    sessionStorage.removeItem(PANEL_ACCESS_KEY_STORAGE);
  }
  return legacy;
}

export function setPanelAccessKey(key: string): void {
  localStorage.setItem(PANEL_ACCESS_KEY_STORAGE, key.trim());
  sessionStorage.removeItem(PANEL_ACCESS_KEY_STORAGE);
}

export function clearPanelAccessKey(): void {
  localStorage.removeItem(PANEL_ACCESS_KEY_STORAGE);
  sessionStorage.removeItem(PANEL_ACCESS_KEY_STORAGE);
}

export function isDiscordSessionInvalidError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("sessão") ||
    m.includes("session") ||
    m.includes("inválid") ||
    m.includes("invalid") ||
    m.includes("expirad") ||
    m.includes("expired")
  );
}
