export const ADMIN_THEME_KEY = "admcmf-theme";

export type AdminTheme = "light" | "dark";

export function readAdminTheme(): AdminTheme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(ADMIN_THEME_KEY);
    return stored === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyAdminThemeClass(theme: AdminTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}
