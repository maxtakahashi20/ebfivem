import type { ReactNode } from "react";

/** Rótulo de seção: traço + texto mono em caixa alta. */
export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div className={`flex items-center gap-3 font-mono text-xs tracking-[0.2em] ${dark ? "text-field" : "text-(--color-olive)"}`}>
      <span className={`h-0.5 w-7 ${dark ? "bg-field" : "bg-(--color-olive)"}`} />
      {children}
    </div>
  );
}

/** Faixa verde → dourado entre o topo e o conteúdo. */
export function Tape({ thick = false }: { thick?: boolean }) {
  return <div className={`${thick ? "h-2.5" : "h-1.5"} bg-linear-to-r from-field to-brass`} />;
}

/** Topo escuro das páginas internas, com foto de fundo. */
export function PageHero(props: { eyebrow: string; title: string; sub: string; img: string }) {
  return (
    <>
      <section
        className="relative bg-night bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(90deg, #0d120af2, #0d120ab3), url(${props.img})` }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-10 pt-20 pb-16 md:pt-24 md:pb-18 flex flex-col gap-5">
          <Eyebrow dark>{props.eyebrow}</Eyebrow>
          <h1 className="font-display font-semibold text-5xl md:text-7xl leading-none text-bone max-w-4xl">
            {props.title}
          </h1>
          <p className="text-lg md:text-xl leading-relaxed text-sand/90 max-w-2xl">{props.sub}</p>
        </div>
      </section>
      <Tape />
    </>
  );
}

/** Rótulo + campo de texto no padrão das fichas. */
export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="block font-mono text-xs tracking-[0.12em] text-(--color-olive) mb-2">{children}</span>;
}

export const inputClass =
  "w-full h-13 bg-white border border-ink/25 px-4 text-base text-ink placeholder:text-mute/60 focus:outline-none focus:ring-2 focus:ring-field";

export const btnPrimary =
  "inline-flex items-center justify-center gap-3 bg-field px-7 py-4 font-display font-semibold tracking-[0.12em] text-night hover:brightness-110 transition disabled:opacity-60";

export const btnGhostDark =
  "inline-flex items-center justify-center gap-3 border border-sand/50 px-7 py-4 font-display tracking-[0.12em] text-sand hover:bg-sand hover:text-night transition";
