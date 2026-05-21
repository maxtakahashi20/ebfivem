import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAdminTheme } from "@/components/admin/AdminThemeProvider";

type Props = {
  className?: string;
  compact?: boolean;
};

export function AdminThemeToggle({ className, compact }: Props) {
  const { isDark, toggleTheme } = useAdminTheme();

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={isDark ? "Modo claro" : "Modo escuro"}
      className={cn(
        "relative inline-flex items-center justify-center rounded-sm border border-(--color-olive-deep)/30",
        "bg-(--color-olive-deep)/5 text-(--color-olive-deep) transition-colors",
        "hover:bg-(--color-olive-deep)/15 hover:border-(--color-olive-deep)/50",
        "dark:border-(--color-stencil)/25 dark:bg-(--color-stencil)/5 dark:text-(--color-stencil)",
        "dark:hover:bg-(--color-stencil)/10 dark:hover:border-(--color-stencil)/40",
        compact ? "size-8" : "size-9",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.4 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className={compact ? "size-3.5" : "size-4"} />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.4 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className={compact ? "size-3.5" : "size-4"} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
