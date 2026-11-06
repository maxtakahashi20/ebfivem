import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Mountain, Sun, Trees, Waves } from "lucide-react";
import { motion } from "framer-motion";
import { Eyebrow, PageHero } from "@/components/site-ui";
import { EASE, Reveal, SplitTitle, Stagger, StaggerItem } from "@/components/motion";

/** Traço vertical da cadeia de comando que se desenha de cima para baixo. */
function Linha({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.span
      className={`${className} origin-top`}
      initial={{ scaleY: 0 }}
      whileInView={{ scaleY: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay, ease: EASE }}
    />
  );
}

const FotoGaleriaSection = lazy(() =>
  import("@/components/organograma/FotoGaleria").then((m) => ({
    default: m.FotoGaleriaSection,
  })),
);

export const Route = createFileRoute("/organograma")({
  head: () => ({
    meta: [
      { title: "Organograma · 2ª DE · Composição da Tropa" },
      {
        name: "description",
        content:
          "Composição da 2ª DE: batalhões, brigadas e unidades de especialização inspirados no Exército Brasileiro.",
      },
    ],
  }),
  component: OrganogramaPage,
});

const BRASOES = [
  { src: "/brasoes/batalhoes-1.webp", alt: "Brasões: 1º BPE, 3º BAvEx e 27º BI PQDT" },
  { src: "/brasoes/batalhoes-2.webp", alt: "Brasões: Cia PREC PQDT, 8º B LOG e 13º BIB" },
  { src: "/brasoes/batalhoes-3.webp", alt: "Brasões: D SAU, 1º BAC e 1º BFESP" },
  { src: "/brasoes/batalhoes-4.webp", alt: "Brasões: COPESP e C I OP ESP" },
  { src: "/brasoes/batalhoes-5.webp", alt: "Brasões: unidades especializadas em biomas" },
] as const;

const unidades = [
  { sigla: "1º BPE", nome: "1º Batalhão de Polícia do Exército", funcao: "Polícia do Exército · Guarda e escolta de autoridades" },
  { sigla: "3º BAvEx", nome: "3º Batalhão de Aviação do Exército — PANTERA", funcao: "Aviação · Apoio aéreo e transporte de tropas" },
  { sigla: "27º BI PQDT", nome: "27º Batalhão de Infantaria Paraquedista", funcao: "Infantaria paraquedista · Operações aeroterrestres" },
  { sigla: "Cia PREC PQDT", nome: "Companhia de Precursores Paraquedista", funcao: "Reconhecimento e marcação de zonas de lançamento" },
  { sigla: "8º B LOG", nome: "8º Batalhão Logístico", funcao: "Logística · Suprimento, manutenção e transporte" },
  { sigla: "13º BIB", nome: "13º Batalhão de Infantaria Blindado", funcao: "Infantaria blindada · Combate mecanizado" },
  { sigla: "D SAU", nome: "Diretoria de Saúde", funcao: "Saúde operacional · Apoio médico em campo" },
  { sigla: "1º BAC", nome: "1º Batalhão de Ações de Comandos", funcao: "Operações especiais · Ações de comandos" },
  { sigla: "1º BFESP", nome: "1º Batalhão de Forças Especiais", funcao: "Forças Especiais · Missões de alta complexidade" },
  { sigla: "COPESP", nome: "Comando de Operações Especiais", funcao: "Comando integrador das operações especiais" },
  { sigla: "C I OP ESP", nome: "Centro de Instrução de Operações Especiais", funcao: "Formação e qualificação de operadores especiais" },
];

const biomas = [
  { sigla: "CIOpC", nome: "Centro de Instrução de Operações na Caatinga", bioma: "Caatinga", icon: Sun },
  { sigla: "1ª BDA INF SL", nome: "1ª Brigada de Infantaria de Selva", bioma: "Selva amazônica", icon: Trees },
  { sigla: "10º BIL MTH", nome: "10º Batalhão de Infantaria Leve Montanha", bioma: "Montanha", icon: Mountain },
  { sigla: "18ª BDA INF Pantanal", nome: "18ª Brigada de Infantaria de Pantanal", bioma: "Pantanal", icon: Waves },
];

function BrasaoImg({
  src,
  alt,
  className,
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      width={800}
      height={600}
      sizes="(max-width: 768px) 100vw, 33vw"
      className={className}
    />
  );
}

const ramos = [
  ["APOIO", "Logística e Saúde"],
  ["COMBATE", "Infantaria e Blindados"],
  ["AVIAÇÃO", "Pantera"],
  ["OP. ESPECIAIS", "COPESP"],
];

function NoComando({ posto, nome, dark }: { posto: string; nome: string; dark?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 px-8 py-4.5 border border-(--color-olive) text-center ${dark ? "bg-ink" : "bg-paper w-full"}`}>
      <div className={`font-mono text-[11px] tracking-[0.15em] ${dark ? "text-brass" : "text-(--color-olive)"}`}>{posto}</div>
      <div className={`font-display text-[22px] font-medium ${dark ? "text-bone" : "text-ink"}`}>{nome}</div>
    </div>
  );
}

function OrganogramaPage() {
  return (
    <div className="bg-bone text-ink">
      <PageHero
        eyebrow="COMPOSIÇÃO DA TROPA"
        title="Batalhões, brigadas e especializações."
        sub="A estrutura da 2ª DE, inspirada nas unidades do Exército Brasileiro, do apoio logístico às operações especiais."
        img="/galeria/123145.webp"
      />

      {/* CADEIA DE COMANDO */}
      <section className="mx-auto max-w-7xl px-4 sm:px-10 pt-20 md:pt-24 flex flex-col items-center">
        <Reveal y={-20}>
          <NoComando dark posto="COMANDANTE · GEN EX" nome="Arthur Vieira" />
        </Reveal>
        <Linha className="h-7 w-0.5 bg-(--color-olive)" delay={0.3} />
        <Reveal y={-20} delay={0.45}>
          <NoComando dark posto="SUBCOMANDANTE · GEN DIV" nome="Rafael" />
        </Reveal>
        <Linha className="h-7 w-0.5 bg-(--color-olive)" delay={0.75} />
        <motion.div
          className="w-full grid grid-cols-2 lg:grid-cols-4 gap-6 lg:px-30 border-t-2 border-(--color-olive)"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.9 } } }}
        >
          {ramos.map(([a, b]) => (
            <StaggerItem key={a} hover className="flex flex-col items-center">
              <span className="h-6 w-0.5 bg-(--color-olive)" />
              <NoComando posto={a} nome={b} />
            </StaggerItem>
          ))}
        </motion.div>
      </section>

      {/* UNIDADES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-10 py-20 flex flex-col gap-10">
        <Reveal className="flex flex-col gap-4">
          <Eyebrow>SEÇÃO I · BATALHÕES E UNIDADES</Eyebrow>
          <SplitTitle as="h2" text={`${unidades.length} unidades em operação`} className="font-display font-semibold text-4xl md:text-5xl" />
        </Reveal>
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BRASOES.slice(0, 4).map((b) => (
            <StaggerItem key={b.src} hover>
              <BrasaoImg src={b.src} alt={b.alt} loading="eager" className="w-full h-60 object-contain bg-ink p-4" />
            </StaggerItem>
          ))}
        </Stagger>
        <Stagger as="ol">
          {unidades.map((u, i) => (
            <StaggerItem as="li" key={u.sigla} className="flex flex-wrap md:flex-nowrap items-center gap-x-6 gap-y-2 py-4.5 border-b border-ink/20">
              <span className="font-mono text-xs text-mute w-6">{String(i + 1).padStart(2, "0")}</span>
              <span className="w-37.5 shrink-0 bg-ink px-2.5 py-1.5 font-display text-sm tracking-wide text-sand">{u.sigla}</span>
              <span className="font-display text-xl flex-1 min-w-60">{u.nome}</span>
              <span className="text-[15px] text-mute md:w-95">{u.funcao}</span>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* BIOMAS */}
      <section className="bg-ink text-bone">
        <div className="mx-auto max-w-7xl px-4 sm:px-10 py-20 md:py-24 flex flex-col gap-10">
          <Reveal>
            <Eyebrow dark>SEÇÃO II · ESPECIALIZAÇÕES POR BIOMA</Eyebrow>
          </Reveal>
          <SplitTitle as="h2" text="Preparada para cada terreno do Brasil." className="font-display font-semibold text-4xl md:text-5xl" />
          <Reveal>
            <BrasaoImg src={BRASOES[4].src} alt={BRASOES[4].alt} className="w-full h-auto max-h-80 object-contain bg-night p-4" />
          </Reveal>
          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {biomas.map((u) => (
              <StaggerItem key={u.sigla} hover className="flex flex-col gap-4 p-7 border border-sand/20 hover:border-brass/60 transition-colors">
                <motion.span
                  className="w-fit"
                  initial={{ rotate: -180, scale: 0 }}
                  whileInView={{ rotate: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 150, damping: 12, delay: 0.3 }}
                >
                  <u.icon className="h-7 w-7 text-brass" />
                </motion.span>
                <div className="font-mono text-xs tracking-[0.15em] text-brass uppercase">{u.bioma}</div>
                <div className="font-display text-[26px] font-medium">{u.sigla}</div>
                <p className="text-[15px] leading-relaxed text-sand/70">{u.nome}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <Suspense
        fallback={
          <section id="galeria" className="bg-night py-16 text-center font-mono text-sm text-sand/70">
            Carregando galeria…
          </section>
        }
      >
        <FotoGaleriaSection />
      </Suspense>

      <section className="bg-paper py-14">
        <Reveal className="mx-auto max-w-4xl px-4 sm:px-10 text-center flex flex-col gap-2">
          <div className="font-mono text-xs tracking-[0.2em] text-(--color-olive)">AVISO INSTITUCIONAL</div>
          <p className="text-mute">
            Todos os brasões e nomenclaturas são referências ao Exército Brasileiro, utilizadas na 2ª DE
            exclusivamente para fins de imersão, entretenimento e roleplay dentro do FiveM.
          </p>
        </Reveal>
      </section>
    </div>
  );
}
