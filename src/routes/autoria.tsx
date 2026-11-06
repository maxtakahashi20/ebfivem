import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHero, btnPrimary } from "@/components/site-ui";

export const Route = createFileRoute("/autoria")({
  head: () => ({
    meta: [
      { title: "Autoria · 2ª DE" },
      { name: "description", content: "Direitos autorais e autoria da 2ª Divisão do Exército." },
    ],
  }),
  component: Autoria,
});

const clausulas = [
  {
    k: "DETENÇÃO DE DIREITOS",
    t: "Todo o conteúdo pertence à 2ª DE",
    x: "Identidade visual, símbolos, logotipos, textos, fichas e sistemas deste portal pertencem exclusivamente à 2ª DE — 2ª Divisão do Exército. Nenhuma parte pode ser reproduzida, distribuída ou usada sem autorização prévia e expressa do Comando.",
  },
  {
    k: "USO FICTÍCIO",
    t: "Uma comunidade de roleplay",
    x: "A 2ª DE é uma comunidade fictícia de roleplay militar no FiveM. Hierarquia, regulamentos, fichas e operações destinam-se exclusivamente ao uso ficcional e não têm vínculo, representação ou autoridade junto ao Exército Brasileiro, às Forças Armadas ou a qualquer órgão oficial do Governo Brasileiro.",
  },
  {
    k: "INSPIRAÇÃO",
    t: "Referência cultural e educacional",
    x: "A doutrina, os valores e a estética operacional são inspirados no Exército Brasileiro como referência cultural e educacional, dentro de um ambiente de entretenimento e simulação militar (milsim).",
  },
];

function Autoria() {
  return (
    <div className="bg-bone text-ink">
      <PageHero
        eyebrow="DOCUMENTO LEGAL · RESERVADO"
        title="Autoria e direitos autorais."
        sub="Quem detém este conteúdo, como ele pode ser usado e qual é o vínculo da 2ª DE com o mundo real."
        img="/galeria/12314.webp"
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-10 py-20 md:py-25">
        {clausulas.map((c, i) => (
          <section key={c.k} className="flex gap-6 md:gap-12 py-10 border-b border-ink/20 reveal">
            <div className="font-display text-[28px] text-field shrink-0">§ {i + 1}</div>
            <div className="flex flex-col gap-2.5">
              <div className="font-mono text-xs tracking-[0.15em] text-(--color-olive)">{c.k}</div>
              <h2 className="font-display text-3xl font-medium">{c.t}</h2>
              <p className="text-lg leading-relaxed text-mute">{c.x}</p>
            </div>
          </section>
        ))}
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 bg-ink px-6 sm:px-9 py-8">
          <div className="flex flex-col gap-2">
            <div className="font-mono text-xs tracking-[0.15em] text-field">CONTATO OFICIAL</div>
            <div className="font-display text-2xl sm:text-[28px] text-bone">discord.gg/2TETa9Z4Fu</div>
          </div>
          <a href="https://discord.gg/2TETa9Z4Fu" target="_blank" rel="noreferrer" className={btnPrimary}>
            ENTRAR NO DISCORD <ArrowUpRight className="h-4.5 w-4.5" />
          </a>
        </div>
        <p className="mt-6 text-right font-mono text-[11px] tracking-wider text-mute">
          © {new Date().getFullYear()} 2ª DE · TODOS OS DIREITOS RESERVADOS
        </p>
      </div>
    </div>
  );
}
