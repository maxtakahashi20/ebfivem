import { motion } from "framer-motion";

export function AdminPageHeader({
  tag,
  title,
  sub,
  action,
}: {
  tag: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-wrap items-end justify-between gap-4 mb-6"
    >
      <div>
        <div className="stencil text-xs mb-1">{tag}</div>
        <h1 className="text-3xl">{title}</h1>
        {sub && <p className="text-sm text-(--color-stencil) mt-0.5">{sub}</p>}
      </div>
      {action}
    </motion.div>
  );
}
