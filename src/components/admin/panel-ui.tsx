import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { CountUp, cardHover, item } from "@/components/motion";

/** Cores de status do painel (design aprovado no pen.dev). */
export const TOM = {
  ok: "#7fbf6a",
  alerta: "#d4a94a",
  info: "#5b8fc4",
  perigo: "#d9785a",
  neutro: "#d9d2b5b3",
} as const;

export type Tom = keyof typeof TOM;

/** Contorno colorido + ponto, em mono caixa alta. */
export function StatusBadge({ tom, children }: { tom: Tom; children: ReactNode }) {
  const c = TOM[tom];
  return (
    <span
      className="inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap"
      style={{ borderColor: c, color: c }}
    >
      <span className="size-1.5 rounded-full" style={{ background: c }} />
      {children}
    </span>
  );
}

/** Cartão de número do topo das telas. */
export function Kpi(props: { label: string; value: ReactNode; sub?: string; tom?: Tom }) {
  return (
    // Entra em sequência dentro de um <Stagger>; fora dele aparece direto.
    <motion.div variants={item} {...cardHover} className="flex flex-col gap-2.5 border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <motion.span
          className="size-2 rounded-full"
          style={{ background: props.tom ? TOM[props.tom] : "#d9d2b5" }}
          animate={props.tom === "alerta" ? { scale: [1, 1.7, 1], opacity: [1, 0.5, 1] } : undefined}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{props.label}</span>
      </div>
      <div className="font-display text-[40px] font-medium leading-none text-foreground">
        {typeof props.value === "number" || (typeof props.value === "string" && /^\d+$/.test(props.value)) ? (
          <CountUp value={String(props.value)} />
        ) : (
          props.value
        )}
      </div>
      {props.sub && <div className="text-[13px] text-muted-foreground">{props.sub}</div>}
    </motion.div>
  );
}

/** Rótulo mono pequeno usado dentro dos cartões. */
export function PanelLabel({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{children}</div>;
}
