import type { ReactNode } from "react";

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
    <div className="flex flex-col gap-2.5 border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: props.tom ? TOM[props.tom] : "#d9d2b5" }} />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{props.label}</span>
      </div>
      <div className="font-display text-[40px] font-medium leading-none text-foreground">{props.value}</div>
      {props.sub && <div className="text-[13px] text-muted-foreground">{props.sub}</div>}
    </div>
  );
}

/** Rótulo mono pequeno usado dentro dos cartões. */
export function PanelLabel({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{children}</div>;
}
