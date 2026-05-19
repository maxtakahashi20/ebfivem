import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/autoria")({
  head: () => ({
    meta: [
      { title: "Autoria · CMF" },
      { name: "description", content: "Direitos autorais e autoria do Comando Militar do Fivem." },
    ],
  }),
  component: Autoria,
});

function Autoria() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="stencil text-xs mb-2">DOCUMENTO LEGAL</div>
      <h1 className="text-4xl md:text-5xl mb-8">Autoria & Direitos Autorais</h1>

      <div className="field-paper p-8 space-y-6 relative">
        <div className="absolute -top-3 left-6 tag-rank">RESERVADO</div>

        <section>
          <div className="stencil text-xs mb-1">DETENÇÃO DE DIREITOS</div>
          <p className="leading-relaxed">
            Todo o conteúdo, identidade visual, símbolos, logotipos, textos, fichas e
            sistemas apresentados neste portal pertencem <strong>exclusivamente ao
            CMF — Comando Militar do Fivem</strong>. Nenhuma parte deste material pode
            ser reproduzida, distribuída ou utilizada sem autorização prévia e expressa
            do Comando.
          </p>
        </section>

        <div className="divider-tape opacity-60" />

        <section>
          <div className="stencil text-xs mb-1">USO FICTÍCIO</div>
          <p className="leading-relaxed">
            O CMF é uma <strong>comunidade fictícia</strong> de roleplay militar dentro
            do jogo FiveM. Todo o material, hierarquia, regulamentos, fichas de
            alistamento e operações descritas neste portal destinam-se
            <strong> exclusivamente ao uso ficcional dentro do jogo</strong> e não
            possuem qualquer vínculo, representação ou autoridade junto ao Exército
            Brasileiro real, às Forças Armadas ou a qualquer órgão oficial do
            Governo Brasileiro.
          </p>
        </section>

        <div className="divider-tape opacity-60" />

        <section>
          <div className="stencil text-xs mb-1">INSPIRAÇÃO</div>
          <p className="leading-relaxed">
            A doutrina, os valores e a estética operacional aqui reproduzidos são
            inspirados no Exército Brasileiro como referência cultural e
            educacional, dentro de um ambiente de entretenimento e simulação militar
            (milsim).
          </p>
        </section>

        <div className="divider-tape opacity-60" />

        <section>
          <div className="stencil text-xs mb-1">CONTATO OFICIAL</div>
          <p className="leading-relaxed">
            Canal oficial do CMF:{" "}
            <a
              href="https://discord.gg/F2T248Ytpj"
              target="_blank"
              rel="noreferrer"
              className="underline text-[color:var(--color-olive-deep)] hover:text-[color:var(--color-olive-bright)]"
            >
              discord.gg/F2T248Ytpj
            </a>
          </p>
        </section>

        <div className="text-[10px] stencil text-right pt-4 border-t border-[color:var(--color-border)]">
          © {new Date().getFullYear()} CMF · TODOS OS DIREITOS RESERVADOS
        </div>
      </div>
    </div>
  );
}
