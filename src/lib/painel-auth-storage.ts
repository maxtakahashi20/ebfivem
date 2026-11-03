/** Chave do painel /ADM2DE — persiste no localStorage (não some ao fechar o navegador). */
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
