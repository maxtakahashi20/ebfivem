import {
  animate,
  motion,
  useInView,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Curva usada em todo o site: entra rápido e assenta devagar. */
export const EASE = [0.22, 1, 0.36, 1] as const;

const VIEWPORT = { once: true, margin: "-80px" } as const;

const TAGS = {
  div: motion.div,
  section: motion.section,
  li: motion.li,
  ol: motion.ol,
  ul: motion.ul,
  dl: motion.dl,
  article: motion.article,
  footer: motion.footer,
};
type Tag = keyof typeof TAGS;

type Base = { children?: ReactNode; className?: string; style?: CSSProperties; as?: Tag; id?: string };

/** Sobe, aparece e tira o desfoque quando entra na tela. */
export function Reveal({
  as = "div",
  delay = 0,
  x = 0,
  y = 32,
  ...rest
}: Base & { delay?: number; x?: number; y?: number }) {
  const C = TAGS[as];
  return (
    <C
      initial={{ opacity: 0, x, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      viewport={VIEWPORT}
      transition={{ duration: 0.7, delay, ease: EASE }}
      {...rest}
    />
  );
}

const grupo: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE } },
};

/** Grade ou lista cujos `StaggerItem` entram em sequência. */
export function Stagger({ as = "div", ...rest }: Base) {
  const C = TAGS[as];
  return <C variants={grupo} initial="hidden" whileInView="show" viewport={VIEWPORT} {...rest} />;
}

/** Card que sobe ao passar o mouse quando `hover` é verdadeiro. */
export function StaggerItem({ as = "div", hover = false, ...rest }: Base & { hover?: boolean }) {
  const C = TAGS[as];
  return <C variants={item} {...(hover ? cardHover : {})} {...rest} />;
}

/** Elevação dos cards no hover e leve aperto no clique. */
export const cardHover = {
  whileHover: { y: -6, transition: { duration: 0.25, ease: EASE } },
  whileTap: { scale: 0.98 },
};

const NBSP = String.fromCharCode(160);
const entradaPalavra: Variants = {
  hidden: { y: "110%", rotate: 4 },
  show: { y: 0, rotate: 0, transition: { duration: 0.7, ease: EASE } },
};

/** Título que entra palavra a palavra; "\n" quebra a linha. O leitor de tela lê a frase inteira. */
export function SplitTitle({
  text,
  className,
  delay = 0,
  as = "h1",
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2";
}) {
  const H = as === "h1" ? motion.h1 : motion.h2;
  return (
    <H
      className={className}
      aria-label={text.replace(/\n/g, " ")}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: delay } },
      }}
    >
      {text.split("\n").map((linha, l) => (
        <Fragment key={l}>
          {l > 0 && <br />}
          {linha.split(" ").map((palavra, i) => (
            <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom pb-[0.08em]">
              <motion.span className="inline-block" variants={entradaPalavra}>
                {palavra}
                {NBSP}
              </motion.span>
            </span>
          ))}
        </Fragment>
      ))}
    </H>
  );
}

/** Conta de 0 até o número ao aparecer; preserva zeros à esquerda ("04"). Texto que não é número aparece direto. */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visivel = useInView(ref, { once: true });
  const numerico = /^\d+$/.test(value);
  const [atual, setAtual] = useState(numerico ? "0".padStart(value.length, "0") : value);

  useEffect(() => {
    if (!numerico || !visivel) return;
    const controle = animate(0, Number(value), {
      duration: 1.4,
      ease: EASE,
      onUpdate: (v) => setAtual(String(Math.round(v)).padStart(value.length, "0")),
    });
    return () => controle.stop();
  }, [numerico, visivel, value]);

  return (
    <span ref={ref} className={className}>
      {atual}
    </span>
  );
}

/** Fundo que desliza mais devagar que a rolagem. O conteúdo fica por cima, parado. */
export function Parallax({
  img,
  overlay,
  className,
  children,
}: {
  img: string;
  overlay: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  return (
    <section ref={ref} className={`relative overflow-hidden bg-night ${className ?? ""}`}>
      <motion.div
        aria-hidden
        className="absolute inset-0 -top-[10%] h-[120%] bg-cover bg-center"
        style={{ y, backgroundImage: `${overlay}, url(${img})` }}
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.6, ease: EASE }}
      />
      <div className="relative">{children}</div>
    </section>
  );
}
