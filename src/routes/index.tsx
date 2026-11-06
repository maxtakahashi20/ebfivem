import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, Star } from "lucide-react";
import banner from "@/assets/banner-2de.jpg";
import { motion } from "framer-motion";
import { Eyebrow, Tape, btnGhostDark, btnPrimary } from "@/components/site-ui";
import {
  CountUp,
  EASE,
  Parallax,
  Reveal,
  SplitTitle,
  Stagger,
  StaggerItem,
  cardHover,
} from "@/components/motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "2ª DE" },
      { name: "description", content: "Portal informativo da 2ª DE. Alistamento milsim no FiveM. Fundada em 8 de outubro de 2023." },
    ],
  }),
  component: Index,
});

// Valores do Exército Brasileiro (oficiais)
const valores = [
  { k: "Patriotismo", d: "Amor à Pátria acima de qualquer interesse particular." },
  { k: "Civismo", d: "Compromisso permanente com a Constituição e a Nação." },
  { k: "Hierarquia", d: "Ordenação progressiva da autoridade em diferentes níveis." },
  { k: "Disciplina", d: "Rigorosa observância das leis, regulamentos e ordens." },
  { k: "Probidade", d: "Honestidade e integridade na conduta militar." },
  { k: "Lealdade", d: "Fidelidade aos compromissos assumidos e aos camaradas." },
];

// História e Propósito da 2ª DE
const fatos = [
  { n: "08 OUT 2023", t: "Fundação", d: "Nasce a 2ª Divisão do Exército com o propósito de trazer o milsim para dentro do FiveM brasileiro, aproximando jovens e adultos do militarismo." },
  { n: "PROPÓSITO", t: "Milsim com Imersão Total", d: "Reproduzir, em ambiente FiveM controlado, a hierarquia, a disciplina e os procedimentos operacionais do Exército Brasileiro, com o máximo de realismo possível." },
  { n: "DOUTRINA", t: "Hierarquia e Disciplina", d: "Toda a tropa é regida por regulamento interno espelhado nos valores do Exército Brasileiro: patriotismo, civismo, lealdade, probidade." },
  { n: "FORMAÇÃO", t: "Instrução Contínua", d: "Conscritos passam por instrução de ordem unida, tiro virtual, patrulha urbana e operações de escolta, sob avaliação de instrutores designados." },
  { n: "HOJE", t: "Tropa Ativa", d: "A 2ª DE segue ativa com operações regulares, alistamentos abertos e uma comunidade que respeita a cadeia de comando." },
];

// Alto Comando atual
const comando = [
  { posto: "GENERAL DE EXÉRCITO", nome: "Arthur Vieira", funcao: "Comandante da 2ª DE" },
  { posto: "GENERAL DE DIVISÃO", nome: "Rafael", funcao: "Subcomandante da 2ª DE" },
];

const ficha = [
  ["OPERAÇÃO", "Alistamento 2ª DE"],
  ["SETOR", "Recrutamento geral"],
  ["EFETIVO", "Comunidade FiveM"],
  ["CONDIÇÃO", "Aberto p/ inscrição"],
];

const numeros = [
  ["08.10.23", "Fundação"],
  ["11", "Batalhões e unidades"],
  ["04", "Brigadas de bioma"],
  ["06", "Valores da doutrina"],
];

const visao = [
  "Operações conjuntas e instrução constante",
  "Tropa instruída, organizada e motivada",
  "Regulamento interno respeitado por todos",
  "Comunidade brasileira em ambiente FiveM",
];

function Index() {
  return (
    <div className="bg-bone text-ink overflow-x-clip">
      {/* HERO */}
      <Parallax
        img={banner}
        overlay="linear-gradient(90deg, #0d120ae6, #0d120a00 70%), linear-gradient(180deg, #0d120a66, #0d120ad9 55%, #0d120a)"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-10 pt-24 md:pt-40">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-12 pb-16">
            <div className="flex flex-col gap-7 max-w-3xl">
              <Reveal y={-12} className="inline-flex w-fit items-center gap-2.5 border border-field px-3.5 py-2 font-mono text-xs tracking-[0.15em] text-sand">
                <span className="h-2 w-2 rounded-full bg-field animate-pulse" />
                ALISTAMENTO ABERTO · TURMA {new Date().getFullYear()}
              </Reveal>
              <SplitTitle
                text={"SIRVA À TROPA.\nHONRE A HIERARQUIA."}
                delay={0.15}
                className="font-display font-semibold text-6xl md:text-[92px] leading-[0.95] tracking-tight text-bone"
              />
              <Reveal delay={0.7}>
                <p className="text-lg md:text-xl leading-relaxed text-sand/90 max-w-xl">
                  A 2ª Divisão do Exército é a comunidade milsim do FiveM que leva a hierarquia, a
                  disciplina e os procedimentos do Exército Brasileiro para dentro do jogo, com o
                  máximo de imersão.
                </p>
              </Reveal>
              <Reveal delay={0.85} className="flex flex-wrap gap-3.5">
                <motion.div {...cardHover}>
                  <Link to="/inscricao" className={btnPrimary}>
                    INICIAR ALISTAMENTO <ArrowRight className="h-4.5 w-4.5" />
                  </Link>
                </motion.div>
                <motion.div {...cardHover}>
                  <Link to="/acompanhar" className={btnGhostDark}>
                    ACOMPANHAR INSCRIÇÃO
                  </Link>
                </motion.div>
              </Reveal>
            </div>

            <Reveal x={60} y={0} delay={0.5} className="w-full lg:w-85 shrink-0 bg-night/80 border border-field/40 backdrop-blur-md">
              <div className="flex justify-between px-5 py-3.5 border-b border-field/40 font-mono text-xs tracking-[0.15em]">
                <span className="text-field">FICHA · 01-A</span>
                <span className="text-sand/60">PÚBLICO</span>
              </div>
              <Stagger as="dl" className="px-5 pt-2 pb-5">
                {ficha.map(([k, v]) => (
                  <StaggerItem key={k} className="flex justify-between py-3 border-b border-sand/10">
                    <dt className="font-mono text-[11px] tracking-widest text-sand/50">{k}</dt>
                    <dd className={k === "CONDIÇÃO" ? "text-field" : "text-sand"}>{v}</dd>
                  </StaggerItem>
                ))}
              </Stagger>
            </Reveal>
          </div>

          <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-6 py-7 border-t border-sand/15">
            {numeros.map(([n, l]) => (
              <StaggerItem key={l} className="flex flex-col gap-1.5">
                <CountUp value={n} className="font-display text-4xl text-bone" />
                <div className="font-mono text-[11px] tracking-[0.15em] text-sand/60 uppercase">{l}</div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Parallax>
      <Tape thick />

      {/* MISSÃO */}
      <section className="mx-auto max-w-7xl px-4 sm:px-10 py-20 md:py-30 grid lg:grid-cols-[1fr_560px] gap-12 lg:gap-20 items-center">
        <Reveal className="flex flex-col gap-6">
          <Eyebrow>SEÇÃO I · OBJETIVO</Eyebrow>
          <SplitTitle
            as="h2"
            text="Milsim de verdade, dentro do FiveM."
            className="font-display font-semibold text-4xl md:text-[56px] leading-[1.05]"
          />
          <p className="text-lg leading-relaxed text-mute">
            Reproduzimos hierarquia, disciplina e procedimentos operacionais inspirados no Exército
            Brasileiro, em um ambiente fictício e controlado. Cada conscrito que se apresenta é
            avaliado por um instrutor designado.
          </p>
          <Stagger as="ul" className="pt-2">
            {visao.map((t) => (
              <StaggerItem as="li" key={t} className="flex items-center gap-4 py-4 border-t border-ink/20 text-[17px]">
                <ChevronRight className="h-4.5 w-4.5 text-field shrink-0" /> {t}
              </StaggerItem>
            ))}
          </Stagger>
        </Reveal>
        <motion.figure
          className="relative h-110 md:h-155 bg-cover bg-center flex items-end"
          style={{ backgroundImage: "linear-gradient(180deg, #0d120a00 50%, #0d120ae6), url(/galeria/1153.webp)" }}
          initial={{ opacity: 0, scale: 1.12, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.1, ease: EASE }}
        >
          <figcaption className="w-full flex justify-between px-6 py-5 font-mono text-[11px] tracking-[0.15em]">
            <span className="text-field">REGISTRO DE OPERAÇÃO</span>
            <span className="text-sand/70">ARQUIVO 2ª DE</span>
          </figcaption>
        </motion.figure>
      </section>

      {/* VALORES */}
      <section className="bg-ink text-bone">
        <div className="mx-auto max-w-7xl px-4 sm:px-10 py-20 md:py-28 flex flex-col gap-14">
          <Reveal className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex flex-col gap-5">
              <Eyebrow dark>SEÇÃO II · DOUTRINA</Eyebrow>
              <SplitTitle as="h2" text="Valores do Exército Brasileiro" className="font-display font-semibold text-4xl md:text-[52px]" />
            </div>
            <p className="text-[17px] leading-relaxed text-sand/70 max-w-sm">
              A base de conduta de cada integrante da 2ª DE, do conscrito ao Alto Comando.
            </p>
          </Reveal>
          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-sand/15">
            {valores.map((v, i) => (
              <StaggerItem
                key={v.k}
                hover
                className="flex flex-col gap-3.5 py-8 lg:px-10 lg:first:pl-0 lg:[&:nth-child(3n+1)]:pl-0 lg:[&:not(:nth-child(3n+1))]:border-l border-sand/15 border-b"
              >
                <div className="font-mono text-[13px] text-brass">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="font-display text-[28px] font-medium">{v.k}</h3>
                <p className="leading-relaxed text-sand/70">{v.d}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* LINHA DO TEMPO + ALTO COMANDO */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-4 sm:px-10 py-20 md:py-28 flex flex-col gap-14">
          <Reveal className="flex flex-col gap-5">
            <Eyebrow>SEÇÃO III · DOCUMENTO HISTÓRICO</Eyebrow>
            <SplitTitle as="h2" text="De 8 de outubro de 2023 até hoje." className="font-display font-semibold text-4xl md:text-[52px]" />
          </Reveal>
          <Stagger as="ol" className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
            {fatos.map((f, i) => (
              <StaggerItem as="li" key={f.n} className="flex flex-col gap-3.5">
                <div className="flex items-center">
                  <span className={`h-3.5 w-3.5 rounded-full shrink-0 ${i === fatos.length - 1 ? "bg-field" : "bg-ink"}`} />
                  {i < fatos.length - 1 && (
                    <motion.span
                      className="h-0.5 flex-1 bg-ink/20 origin-left"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.12, ease: EASE }}
                    />
                  )}
                </div>
                <div className="font-mono text-xs tracking-[0.15em] text-(--color-olive)">{f.n}</div>
                <div className="font-display text-2xl font-medium">{f.t}</div>
                <p className="text-[15px] leading-relaxed text-mute">{f.d}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <Stagger className="grid lg:grid-cols-[360px_1fr_1fr] gap-6 pt-6">
            <StaggerItem className="flex flex-col gap-2.5">
              <div className="font-mono text-xs tracking-[0.2em] text-(--color-olive)">ALTO COMANDO · EM EXERCÍCIO</div>
              <div className="font-display text-3xl font-medium">Quem comanda a 2ª DE hoje.</div>
            </StaggerItem>
            {comando.map((c) => (
              <StaggerItem key={c.nome} hover className="flex items-center gap-5 p-6 bg-ink">
                <motion.div
                  className="h-16 w-16 shrink-0 bg-night border border-brass flex items-center justify-center"
                  initial={{ rotate: -90, scale: 0 }}
                  whileInView={{ rotate: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.3 }}
                >
                  <Star className="h-6.5 w-6.5 text-brass" />
                </motion.div>
                <div className="flex flex-col gap-1.5">
                  <div className="font-mono text-[11px] tracking-[0.15em] text-brass">{c.posto}</div>
                  <div className="font-display text-[28px] font-medium text-bone">{c.nome}</div>
                  <div className="text-[15px] text-sand/70">{c.funcao}</div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CONVOCAÇÃO */}
      <Parallax img="/galeria/12.webp" overlay="linear-gradient(#0d120ad9, #0d120ad9)">
        <div className="mx-auto max-w-7xl px-4 sm:px-10 py-28 md:py-36 flex flex-col items-center gap-7 text-center">
          <Reveal className="font-mono text-[13px] tracking-[0.3em] text-field">CONVOCAÇÃO</Reveal>
          <SplitTitle as="h2" text="A tropa conta com você." className="font-display font-semibold text-5xl md:text-[80px] text-bone" />
          <Reveal delay={0.3}>
            <p className="text-lg md:text-xl text-sand/90 max-w-2xl">
              Preencha sua ficha. Um instrutor designado da 2ª DE analisa cada candidatura.
            </p>
          </Reveal>
          <Reveal delay={0.45}>
            <motion.div
              {...cardHover}
              animate={{ boxShadow: ["0 0 0 0 #6b8e2366", "0 0 0 14px #6b8e2300"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            >
              <Link to="/inscricao" className={btnPrimary}>
                APRESENTAR-SE AO COMANDO <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            </motion.div>
          </Reveal>
        </div>
      </Parallax>
    </div>
  );
}
