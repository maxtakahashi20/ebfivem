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
      <div className="flex flex-col gap-2">
        <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-(--color-olive-bright)">
          {tag}
        </div>
        <h1 className="font-display text-[32px] font-semibold leading-tight text-foreground">{title}</h1>
        {sub && <p className="text-[15px] text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </motion.div>
  );
}
