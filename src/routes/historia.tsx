import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/historia")({
  head: () => ({
    meta: [
      { title: "História · CMF" },
      { name: "description", content: "História do Comando Militar do Fivem — fundado em 8 de outubro de 2023." },
    ],
  }),
  component: Historia,
});

const cap = [
  {
    ano: "08 OUT 2023 — Fundação",
    txt: "O Comando Militar do Fivem (CMF) é fundado com o propósito de trazer o milsim para dentro do FiveM e aproximar jovens e adultos do militarismo com o máximo de imersão possível.",
  },
  {
    ano: "Estruturação — Hierarquia",
    txt: "Definição do regulamento interno, da cadeia de comando e das doutrinas de instrução. O CMF adota a hierarquia e os valores do Exército Brasileiro como base de conduta.",
  },
  {
    ano: "Primeiras Operações",
    txt: "Inauguração das operações conjuntas: instrução de ordem unida, instrução de tiro virtual, patrulha urbana e operações de escolta, todas em ambiente FiveM controlado.",
  },
  {
    ano: "Expansão da Tropa",
    txt: "Abertura de alistamentos públicos. Novos pelotões são formados e os conscritos passam por avaliação de instrutores designados antes de serem incorporados.",
  },
  {
    ano: "Hoje — Imersão Total",
    txt: "O CMF segue ativo, com operações regulares, formação contínua e uma comunidade que respeita a hierarquia, a disciplina e a camaradagem militar.",
  },
];

function Historia() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="stencil text-xs mb-2">DOCUMENTO HISTÓRICO · CMF</div>
      <h1 className="text-4xl md:text-5xl mb-2">História do CMF</h1>
      <p className="text-[color:var(--color-stencil)] mb-8 max-w-2xl">
        Comando Militar do Fivem — fundado em 8 de outubro de 2023.
      </p>
      <div className="field-paper p-8 space-y-6">
        {cap.map((c, i) => (
          <div key={i} className="reveal" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="font-display tracking-widest text-[color:var(--color-olive-deep)] text-lg">{c.ano}</div>
            <p className="text-[color:var(--color-stencil)] leading-relaxed mt-1">{c.txt}</p>
            {i < cap.length - 1 && <div className="divider-tape mt-6 opacity-60" />}
          </div>
        ))}
      </div>
    </div>
  );
}
