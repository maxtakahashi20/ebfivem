import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, Star } from "lucide-react";
import banner from "@/assets/banner-2de.jpg";
import { Eyebrow, Tape, btnGhostDark, btnPrimary } from "@/components/site-ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "2ª DE · 2ª Divisão do Exército" },
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
    <div className="bg-bone text-ink">
      {/* HERO */}
      <section
        className="bg-night bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(90deg, #0d120ae6, #0d120a00 70%), linear-gradient(180deg, #0d120a66, #0d120ad9 55%, #0d120a), url(${banner})`,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-10 pt-24 md:pt-40">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-12 pb-16">
            <div className="flex flex-col gap-7 max-w-3xl reveal">
              <div className="inline-flex w-fit items-center gap-2.5 border border-field px-3.5 py-2 font-mono text-xs tracking-[0.15em] text-sand">
                <span className="h-2 w-2 rounded-full bg-field animate-pulse" />
                ALISTAMENTO ABERTO · TURMA {new Date().getFullYear()}
              </div>
              <h1 className="font-display font-semibold text-6xl md:text-[92px] leading-[0.95] tracking-tight text-bone">
                SIRVA À TROPA.
                <br />
                HONRE A HIERARQUIA.
              </h1>
              <p className="text-lg md:text-xl leading-relaxed text-sand/90 max-w-xl">
                A 2ª Divisão do Exército é a comunidade milsim do FiveM que leva a hierarquia, a
                disciplina e os procedimentos do Exército Brasileiro para dentro do jogo, com o
                máximo de imersão.
              </p>
              <div className="flex flex-wrap gap-3.5">
                <Link to="/inscricao" className={btnPrimary}>
                  INICIAR ALISTAMENTO <ArrowRight className="h-4.5 w-4.5" />
                </Link>
                <Link to="/acompanhar" className={btnGhostDark}>
                  ACOMPANHAR INSCRIÇÃO
                </Link>
              </div>
            </div>

            <div className="w-full lg:w-85 shrink-0 bg-night/80 border border-field/40 backdrop-blur-md reveal" style={{ animationDelay: ".15s" }}>
              <div className="flex justify-between px-5 py-3.5 border-b border-field/40 font-mono text-xs tracking-[0.15em]">
                <span className="text-field">FICHA · 01-A</span>
                <span className="text-sand/60">PÚBLICO</span>
              </div>
              <dl className="px-5 pt-2 pb-5">
                {ficha.map(([k, v]) => (
                  <div key={k} className="flex justify-between py-3 border-b border-sand/10">
                    <dt className="font-mono text-[11px] tracking-widest text-sand/50">{k}</dt>
                    <dd className={k === "CONDIÇÃO" ? "text-field" : "text-sand"}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-7 border-t border-sand/15">
            {numeros.map(([n, l]) => (
              <div key={l} className="flex flex-col gap-1.5">
                <div className="font-display text-4xl text-bone">{n}</div>
                <div className="font-mono text-[11px] tracking-[0.15em] text-sand/60 uppercase">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Tape thick />

      {/* MISSÃO */}
      <section className="mx-auto max-w-7xl px-4 sm:px-10 py-20 md:py-30 grid lg:grid-cols-[1fr_560px] gap-12 lg:gap-20 items-center">
        <div className="flex flex-col gap-6 reveal">
          <Eyebrow>SEÇÃO I · OBJETIVO</Eyebrow>
          <h2 className="font-display font-semibold text-4xl md:text-[56px] leading-[1.05]">
            Milsim de verdade, dentro do FiveM.
          </h2>
          <p className="text-lg leading-relaxed text-mute">
            Reproduzimos hierarquia, disciplina e procedimentos operacionais inspirados no Exército
            Brasileiro, em um ambiente fictício e controlado. Cada conscrito que se apresenta é
            avaliado por um instrutor designado.
          </p>
          <ul className="pt-2">
            {visao.map((t) => (
              <li key={t} className="flex items-center gap-4 py-4 border-t border-ink/20 text-[17px]">
                <ChevronRight className="h-4.5 w-4.5 text-field shrink-0" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <figure
          className="relative h-110 md:h-155 bg-cover bg-center flex items-end reveal"
          style={{ backgroundImage: "linear-gradient(180deg, #0d120a00 50%, #0d120ae6), url(/galeria/1153.webp)" }}
        >
          <figcaption className="w-full flex justify-between px-6 py-5 font-mono text-[11px] tracking-[0.15em]">
            <span className="text-field">REGISTRO DE OPERAÇÃO</span>
            <span className="text-sand/70">ARQUIVO 2ª DE</span>
          </figcaption>
        </figure>
      </section>

      {/* VALORES */}
      <section className="bg-ink text-bone">
        <div className="mx-auto max-w-7xl px-4 sm:px-10 py-20 md:py-28 flex flex-col gap-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex flex-col gap-5">
              <Eyebrow dark>SEÇÃO II · DOUTRINA</Eyebrow>
              <h2 className="font-display font-semibold text-4xl md:text-[52px]">Valores do Exército Brasileiro</h2>
            </div>
            <p className="text-[17px] leading-relaxed text-sand/70 max-w-sm">
              A base de conduta de cada integrante da 2ª DE, do conscrito ao Alto Comando.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-sand/15">
            {valores.map((v, i) => (
              <div
                key={v.k}
                className="flex flex-col gap-3.5 py-8 lg:px-10 lg:first:pl-0 lg:[&:nth-child(3n+1)]:pl-0 lg:[&:not(:nth-child(3n+1))]:border-l border-sand/15 border-b reveal"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="font-mono text-[13px] text-brass">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="font-display text-[28px] font-medium">{v.k}</h3>
                <p className="leading-relaxed text-sand/70">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LINHA DO TEMPO + ALTO COMANDO */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-4 sm:px-10 py-20 md:py-28 flex flex-col gap-14">
          <div className="flex flex-col gap-5">
            <Eyebrow>SEÇÃO III · DOCUMENTO HISTÓRICO</Eyebrow>
            <h2 className="font-display font-semibold text-4xl md:text-[52px]">De 8 de outubro de 2023 até hoje.</h2>
          </div>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
            {fatos.map((f, i) => (
              <li key={f.n} className="flex flex-col gap-3.5 reveal" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center">
                  <span className={`h-3.5 w-3.5 rounded-full shrink-0 ${i === fatos.length - 1 ? "bg-field" : "bg-ink"}`} />
                  {i < fatos.length - 1 && <span className="h-0.5 flex-1 bg-ink/20" />}
                </div>
                <div className="font-mono text-xs tracking-[0.15em] text-(--color-olive)">{f.n}</div>
                <div className="font-display text-2xl font-medium">{f.t}</div>
                <p className="text-[15px] leading-relaxed text-mute">{f.d}</p>
              </li>
            ))}
          </ol>
          <div className="grid lg:grid-cols-[360px_1fr_1fr] gap-6 pt-6">
            <div className="flex flex-col gap-2.5">
              <div className="font-mono text-xs tracking-[0.2em] text-(--color-olive)">ALTO COMANDO · EM EXERCÍCIO</div>
              <div className="font-display text-3xl font-medium">Quem comanda a 2ª DE hoje.</div>
            </div>
            {comando.map((c) => (
              <div key={c.nome} className="flex items-center gap-5 p-6 bg-ink reveal">
                <div className="h-16 w-16 shrink-0 bg-night border border-brass flex items-center justify-center">
                  <Star className="h-6.5 w-6.5 text-brass" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="font-mono text-[11px] tracking-[0.15em] text-brass">{c.posto}</div>
                  <div className="font-display text-[28px] font-medium text-bone">{c.nome}</div>
                  <div className="text-[15px] text-sand/70">{c.funcao}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONVOCAÇÃO */}
      <section
        className="bg-night bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(#0d120ad9, #0d120ad9), url(/galeria/12.webp)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-10 py-28 md:py-36 flex flex-col items-center gap-7 text-center">
          <div className="font-mono text-[13px] tracking-[0.3em] text-field">CONVOCAÇÃO</div>
          <h2 className="font-display font-semibold text-5xl md:text-[80px] text-bone">A tropa conta com você.</h2>
          <p className="text-lg md:text-xl text-sand/90 max-w-2xl">
            Preencha sua ficha. Um instrutor designado da 2ª DE analisa cada candidatura.
          </p>
          <Link to="/inscricao" className={btnPrimary}>
            APRESENTAR-SE AO COMANDO <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
