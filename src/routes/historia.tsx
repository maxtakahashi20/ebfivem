import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site-ui";

export const Route = createFileRoute("/historia")({
  head: () => ({
    meta: [
      { title: "História · 2ª DE" },
      { name: "description", content: "História da 2ª Divisão do Exército — fundada em 8 de outubro de 2023." },
    ],
  }),
  component: Historia,
});

const cap = [
  {
    data: "08 OUT 2023",
    titulo: "Fundação",
    txt: "A 2ª Divisão do Exército (2ª DE) é fundada com o propósito de trazer o milsim para dentro do FiveM e aproximar jovens e adultos do militarismo com o máximo de imersão possível.",
  },
  {
    data: "ESTRUTURAÇÃO",
    titulo: "Hierarquia",
    txt: "Definição do regulamento interno, da cadeia de comando e das doutrinas de instrução. A 2ª DE adota a hierarquia e os valores do Exército Brasileiro como base de conduta.",
  },
  {
    data: "OPERAÇÕES",
    titulo: "Primeiras operações",
    txt: "Inauguração das operações conjuntas: instrução de ordem unida, instrução de tiro virtual, patrulha urbana e operações de escolta, todas em ambiente FiveM controlado.",
  },
  {
    data: "EXPANSÃO",
    titulo: "Expansão da tropa",
    txt: "Abertura de alistamentos públicos. Novos pelotões são formados e os conscritos passam por avaliação de instrutores designados antes de serem incorporados.",
  },
  {
    data: "HOJE",
    titulo: "Imersão total",
    txt: "A 2ª DE segue ativa, com operações regulares, formação contínua e uma comunidade que respeita a hierarquia, a disciplina e a camaradagem militar.",
  },
];

const num = (i: number) => String(i + 1).padStart(2, "0");

function Historia() {
  return (
    <div className="bg-bone text-ink">
      <PageHero
        eyebrow="DOCUMENTO HISTÓRICO · 2ª DE"
        title="A história da 2ª DE."
        sub="Da fundação em 8 de outubro de 2023 à tropa ativa de hoje: como a 2ª Divisão do Exército se estruturou."
        img="/galeria/123.webp"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-10 py-20 md:py-25 flex flex-col lg:flex-row gap-12 lg:gap-20">
        <nav className="lg:w-75 shrink-0 lg:sticky lg:top-28 self-start w-full">
          <div className="font-mono text-[11px] tracking-[0.2em] text-(--color-olive)">CAPÍTULOS</div>
          {cap.map((c, i) => (
            <a key={c.titulo} href={`#cap-${i + 1}`} className="flex gap-3.5 py-3.5 border-b border-ink/20 group">
              <span className="font-mono text-[13px] text-field">{num(i)}</span>
              <span className="font-display text-[17px] text-mute group-hover:text-ink">{c.titulo}</span>
            </a>
          ))}
        </nav>
        <article className="flex-1">
          {cap.map((c, i) => (
            <section
              key={c.titulo}
              id={`cap-${i + 1}`}
              className="flex gap-6 md:gap-10 py-9 border-t border-ink/20 first:border-t-0 first:pt-0 scroll-mt-28 reveal"
            >
              <div className="font-display text-5xl md:text-[64px] font-light leading-none text-field">{num(i)}</div>
              <div className="flex flex-col gap-2.5">
                <div className="font-mono text-xs tracking-[0.15em] text-(--color-olive)">{c.data}</div>
                <h2 className="font-display text-3xl md:text-[34px] font-medium">{c.titulo}</h2>
                <p className="text-lg leading-relaxed text-mute">{c.txt}</p>
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
