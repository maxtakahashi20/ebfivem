import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ADMIN_THEME_KEY,
  applyAdminThemeClass,
  readAdminTheme,
  type AdminTheme,
} from "@/lib/admin-theme";

type AdminThemeContextValue = {
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;
  isDark: boolean;
};

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>(() => readAdminTheme());

  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next);
    applyAdminThemeClass(next);
    try {
      localStorage.setItem(ADMIN_THEME_KEY, next);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  useEffect(() => {
    applyAdminThemeClass(theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isDark: theme === "dark",
    }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }
  return ctx;
}
