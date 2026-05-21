import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  viewKey: string;
  children: ReactNode;
};

export function AdminPageTransition({ viewKey, children }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(3px)" }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
