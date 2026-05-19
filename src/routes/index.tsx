import { createFileRoute, Link } from "@tanstack/react-router";
import banner from "@/assets/cmf-banner.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CMF · Comando Militar do Fivem" },
      { name: "description", content: "Portal informativo do CMF. Alistamento milsim no FiveM. Fundado em 8 de outubro de 2023." },
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

// História e Propósito do CMF
const fatos = [
  { n: "08 OUT 2023", t: "Fundação do CMF", d: "Nasce o Comando Militar do Fivem com o propósito de trazer o milsim para dentro do FiveM brasileiro, aproximando jovens e adultos do militarismo." },
  { n: "PROPÓSITO", t: "Milsim com Imersão Total", d: "Reproduzir, em ambiente FiveM controlado, a hierarquia, a disciplina e os procedimentos operacionais do Exército Brasileiro, com o máximo de realismo possível." },
  { n: "DOUTRINA", t: "Hierarquia e Disciplina", d: "Toda a tropa é regida por regulamento interno espelhado nos valores do Exército Brasileiro: patriotismo, civismo, lealdade, probidade." },
  { n: "FORMAÇÃO", t: "Instrução Contínua", d: "Conscritos passam por instrução de ordem unida, tiro virtual, patrulha urbana e operações de escolta, sob avaliação de instrutores designados." },
  { n: "HOJE", t: "Tropa Ativa", d: "O CMF segue ativo com operações regulares, alistamentos abertos e uma comunidade que respeita a cadeia de comando." },
];

// Alto Comando atual
const comando = [
  { posto: "GENERAL DE EXÉRCITO", nome: "Arthur Vieira", funcao: "Comandante do CMF" },
  { posto: "GENERAL DE DIVISÃO", nome: "Rafael", funcao: "Subcomandante do CMF" },
];

function Index() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b-2 border-[color:var(--color-olive-deep)]">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${banner})` }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black/80 via-[color:var(--color-olive-deep)]/85 to-black/70" />
        <div className="absolute inset-0 -z-10 opacity-25"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(0,0,0,0.4) 0 2px, transparent 2px 8px)",
          }}
        />
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 grid md:grid-cols-[1.4fr_1fr] gap-10 items-center text-[color:var(--color-khaki)]">
          <div className="reveal">
            <div className="tag-rank mb-6 bg-[color:var(--color-olive-bright)] text-white">
              ◆ ALISTAMENTO ABERTO · 2026
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-6">
              Comando Militar<br/>
              <span className="text-[color:var(--color-olive-bright)]">do Fivem.</span>
            </h1>
            <p className="max-w-xl text-base md:text-lg opacity-95 mb-8 font-body">
              O CMF é uma comunidade milsim dedicada a aproximar jovens e adultos do militarismo
              dentro do FiveM, com o máximo de imersão possível. Apresente-se, registre sua ficha
              e siga a hierarquia.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/inscricao" className="btn-olive text-base">
                ▸ Iniciar Alistamento
              </Link>
              <Link to="/acompanhar" className="btn-ghost-olive text-[color:var(--color-khaki)] border-[color:var(--color-khaki)] hover:bg-[color:var(--color-khaki)] hover:text-[color:var(--color-olive-deep)]">
                Acompanhar Inscrição
              </Link>
            </div>
          </div>

          <div className="reveal" style={{ animationDelay: ".15s" }}>
            <div className="field-paper bg-[color:var(--color-khaki)] text-[color:var(--color-olive-deep)] p-6 relative">
              <div className="absolute -top-3 left-4 tag-rank">FICHA · 01-A</div>
              <div className="stencil text-xs mb-3">CLASSIFICAÇÃO: PÚBLICO</div>
              <pre className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap">
{`OPERAÇÃO   : ALISTAMENTO CMF
SETOR      : RECRUTAMENTO GERAL
EFETIVO    : COMUNIDADE FIVEM
PROTOCOLO  : EB-XX-XXXXXX
CONDIÇÃO   : ABERTO P/ INSCRIÇÃO

> SIRVA À TROPA
> HONRE A HIERARQUIA
> CONSTRUA A IMERSÃO`}
              </pre>
              <div className="mt-6 flex justify-end">
                <div className="stamp-cmf">CMF</div>
              </div>
            </div>
          </div>
        </div>
        <div className="divider-tape" />
      </section>

      {/* MISSÃO */}
      <section className="grad-1">
        <div className="mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-2 gap-12 items-start">
          <div className="reveal">
            <div className="stencil text-xs mb-2">SEÇÃO I · OBJETIVO</div>
            <h2 className="text-3xl md:text-4xl mb-4">Missão do CMF</h2>
            <p className="text-[color:var(--color-stencil)] leading-relaxed">
              Trazer o milsim para dentro do FiveM, aproximando jovens e adultos do militarismo com
              o máximo de imersão possível. Reproduzimos hierarquia, disciplina e procedimentos
              operacionais inspirados no Exército Brasileiro, em um ambiente fictício controlado.
            </p>
            <p className="text-[color:var(--color-stencil)] leading-relaxed mt-4">
              Cada conscrito que se apresenta é avaliado por um instrutor designado. A tropa é
              construída pela seriedade dos integrantes e pelo respeito à cadeia de comando.
            </p>
          </div>
          <div className="field-paper p-6 relative scan overflow-hidden reveal">
            <div className="stencil text-xs mb-3">VISÃO OPERACIONAL</div>
            <h3 className="text-2xl mb-3">Imersão, hierarquia e camaradagem.</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><span className="text-[color:var(--color-olive-bright)]">▸</span> Operações conjuntas e instrução constante.</li>
              <li className="flex gap-2"><span className="text-[color:var(--color-olive-bright)]">▸</span> Tropa instruída, organizada e motivada.</li>
              <li className="flex gap-2"><span className="text-[color:var(--color-olive-bright)]">▸</span> Regulamento interno respeitado por todos.</li>
              <li className="flex gap-2"><span className="text-[color:var(--color-olive-bright)]">▸</span> Comunidade brasileira em ambiente FiveM.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="grad-2 border-y-2 border-[color:var(--color-olive-deep)] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="stencil text-xs mb-2">SEÇÃO II · DOUTRINA</div>
          <h2 className="text-3xl md:text-4xl mb-3">Valores do Exército Brasileiro</h2>
          <p className="text-[color:var(--color-stencil)] mb-10 max-w-2xl">
            Os valores oficiais do Exército Brasileiro que servem de base para a conduta dentro do CMF.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {valores.map((v, i) => (
              <div key={v.k} className="field-paper p-5 reveal" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 bg-[color:var(--color-olive-deep)] text-[color:var(--color-olive-bright)] flex items-center justify-center font-display text-sm">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="text-lg">{v.k}</h3>
                </div>
                <p className="text-sm text-[color:var(--color-stencil)]">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HISTÓRIA E PROPÓSITO */}
      <section className="grad-3 py-20 text-[color:var(--color-khaki)]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="stencil text-xs mb-2 text-[color:var(--color-gold)]">SEÇÃO III · DOCUMENTO HISTÓRICO</div>
          <h2 className="text-3xl md:text-4xl mb-3 text-white">História e Propósito do CMF</h2>
          <p className="text-[color:var(--color-khaki)] mb-10 max-w-2xl">
            Da fundação em 8 de outubro de 2023 até as operações de hoje — o que o CMF é, e por que existe.
          </p>
          <ol className="relative border-l-2 border-[color:var(--color-gold)] ml-3 space-y-8">
            {fatos.map((f, i) => (
              <li key={f.n} className="pl-6 reveal" style={{ animationDelay: `${i * 0.05}s` }}>
                <span className="absolute -left-[11px] mt-1 h-5 w-5 rounded-full bg-[color:var(--color-gold)] border-2 border-white" />
                <div className="font-display text-xl tracking-widest text-[color:var(--color-gold)]">{f.n} · {f.t}</div>
                <div className="text-sm text-[color:var(--color-khaki)]">{f.d}</div>
              </li>
            ))}
          </ol>

          {/* ALTO COMANDO ATUAL */}
          <div className="mt-16">
            <div className="stencil text-xs mb-2 text-[color:var(--color-gold)]">ALTO COMANDO · EM EXERCÍCIO</div>
            <h3 className="text-2xl md:text-3xl mb-6 text-white">Comandantes Atuais do CMF</h3>
            <div className="grid md:grid-cols-2 gap-5">
              {comando.map((c) => (
                <div key={c.nome} className="field-paper p-6 text-[color:var(--color-stencil)] reveal">
                  <div className="tag-rank mb-3">{c.posto}</div>
                  <div className="font-display text-2xl text-[color:var(--color-olive-deep)] tracking-wider">{c.nome}</div>
                  <div className="text-sm mt-1">{c.funcao}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden grad-4">
        <div className="absolute inset-0 -z-10 opacity-15"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 12px)" }} />
        <div className="mx-auto max-w-6xl px-6 py-20 text-center text-[color:var(--color-khaki)]">
          <div className="stencil text-xs text-[color:var(--color-olive-bright)] mb-2">CONVOCAÇÃO</div>
          <h2 className="text-4xl md:text-5xl mb-4">A tropa conta com você.</h2>
          <p className="opacity-90 mb-8 max-w-2xl mx-auto">
            Preencha sua ficha de alistamento. Sua candidatura será analisada por um instrutor designado do CMF.
          </p>
          <Link to="/inscricao" className="btn-olive text-base">
            ▸ Apresentar-se ao Comando
          </Link>
        </div>
      </section>
    </div>
  );
}
