export const ADMIN_THEME_KEY = "adm2de-theme";

export type AdminTheme = "light" | "dark";

/** Escuro é o padrão; claro só para quem escolheu. */
export function readAdminTheme(): AdminTheme {
  if (typeof window === "undefined") return "dark";
  try {
    return localStorage.getItem(ADMIN_THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyAdminThemeClass(theme: AdminTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}
