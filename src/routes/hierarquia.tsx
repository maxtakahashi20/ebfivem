import { createFileRoute } from "@tanstack/react-router";
import { Eyebrow, PageHero } from "@/components/site-ui";
import { listarHierarquia, type ItemHierarquia } from "@/lib/hierarquia.functions";

export const Route = createFileRoute("/hierarquia")({
  head: () => ({
    meta: [
      { title: "Hierarquia · 2ª DE" },
      { name: "description", content: "Cadeia de comando da 2ª DE: postos, graduações e quem os ocupa." },
    ],
  }),
  loader: () => listarHierarquia(),
  component: HierarquiaPage,
});

/** Junta itens seguidos do mesmo posto num só degrau. */
function degraus(itens: ItemHierarquia[]) {
  const out: { posto: string; membros: ItemHierarquia[] }[] = [];
  for (const i of itens) {
    const ultimo = out.at(-1);
    if (ultimo?.posto === i.posto) ultimo.membros.push(i);
    else out.push({ posto: i.posto, membros: [i] });
  }
  return out;
}

function HierarquiaPage() {
  const lista = degraus(Route.useLoaderData());

  return (
    <div className="bg-bone text-ink">
      <PageHero
        eyebrow="CADEIA DE COMANDO"
        title="Hierarquia da 2ª DE."
        sub="Do comando-geral às graduações: quem responde por quem dentro da divisão."
        img="/galeria/123145.webp"
      />

      <section className="mx-auto max-w-5xl px-4 sm:px-10 py-20 md:py-24 flex flex-col gap-10">
        <Eyebrow>POSTOS E GRADUAÇÕES</Eyebrow>
        {lista.length === 0 ? (
          <p className="text-lg text-mute">A hierarquia ainda está sendo publicada.</p>
        ) : (
          <ol className="flex flex-col items-center">
            {lista.map((d, i) => (
              <li key={`${d.posto}-${i}`} className="flex w-full flex-col items-center">
                {i > 0 && <span className="h-8 w-0.5 bg-(--color-olive)" />}
                <div className={`w-full max-w-2xl border border-(--color-olive) ${i === 0 ? "bg-ink text-bone" : "bg-paper"}`}>
                  <div className={`px-6 py-3 font-mono text-xs tracking-[0.18em] uppercase border-b border-(--color-olive)/40 ${i === 0 ? "text-brass" : "text-(--color-olive)"}`}>
                    {String(i + 1).padStart(2, "0")} · {d.posto}
                  </div>
                  <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 px-6 py-5">
                    {d.membros.map((m) => (
                      <li key={m.id} className="text-center">
                        <div className="font-display text-xl font-medium">{m.nome ?? "Vago"}</div>
                        {m.funcao && <div className={`text-sm ${i === 0 ? "text-sand/80" : "text-mute"}`}>{m.funcao}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
