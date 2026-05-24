import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const FotoGaleriaSection = lazy(() =>
  import("@/components/organograma/FotoGaleria").then((m) => ({
    default: m.FotoGaleriaSection,
  })),
);

export const Route = createFileRoute("/organograma")({
  head: () => ({
    meta: [
      { title: "Organograma · CMF · Composição da Tropa" },
      {
        name: "description",
        content:
          "Composição do CMF: batalhões, brigadas e unidades de especialização inspirados no Exército Brasileiro.",
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
  { sigla: "CIOpC", nome: "Centro de Instrução de Operações na Caatinga", bioma: "Caatinga" },
  { sigla: "1ª BDA INF SL", nome: "1ª Brigada de Infantaria de Selva", bioma: "Selva amazônica" },
  { sigla: "10º BIL MTH", nome: "10º Batalhão de Infantaria Leve Montanha", bioma: "Montanha" },
  { sigla: "18ª BDA INF Pantanal", nome: "18ª Brigada de Infantaria de Pantanal", bioma: "Pantanal" },
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

function OrganogramaPage() {
  return (
    <div>
      <section className="grad-3 border-b-2 border-(--color-olive-deep) text-(--color-khaki)">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="stencil text-xs mb-2 text-(--color-gold)">
            DOCUMENTO ORG · COMPOSIÇÃO DA TROPA
          </div>
          <h1 className="font-display text-4xl md:text-6xl leading-tight text-white mb-4">
            Organograma do CMF
          </h1>
          <p className="max-w-2xl opacity-90 mb-6">
            Estrutura operacional do Comando Militar do Fivem, organizada em batalhões,
            brigadas e unidades de especialização inspiradas diretamente no Exército Brasileiro.
          </p>
          <a href="#galeria" className="btn-olive inline-block text-xs tracking-widest">
            ▸ VER GALERIA DE FOTOS
          </a>
        </div>
      </section>

      <section className="grad-1 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="stencil text-xs mb-2">SEÇÃO I · BATALHÕES E UNIDADES</div>
          <h2 className="text-3xl md:text-4xl mb-3">Batalhões e Brigadas</h2>
          <p className="text-(--color-stencil) mb-10 max-w-2xl">
            Cada unidade possui seu próprio brasão, doutrina e missão dentro da estrutura do CMF.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {BRASOES.slice(0, 3).map((b) => (
              <BrasaoImg
                key={b.src}
                src={b.src}
                alt={b.alt}
                loading="eager"
                className="w-full h-auto border-2 border-(--color-olive-deep) bg-(--color-khaki) p-3"
              />
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-10">
            <BrasaoImg
              src={BRASOES[3].src}
              alt={BRASOES[3].alt}
              className="w-full h-auto border-2 border-(--color-olive-deep) bg-(--color-khaki) p-3"
            />
            <div className="field-paper p-5">
              <div className="tag-rank mb-3">COMANDO · OP. ESPECIAIS</div>
              <p className="text-sm text-(--color-stencil)">
                O COPESP integra e comanda as operações especiais do CMF, com apoio direto do
                Centro de Instrução de Operações Especiais (C I OP ESP), responsável pela
                formação e qualificação dos operadores.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {unidades.map((u, i) => (
              <div key={u.sigla} className="field-paper p-4 reveal" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="flex items-center gap-3 mb-1">
                  <div className="tag-rank">{u.sigla}</div>
                  <div className="font-display text-sm tracking-wider text-(--color-olive-deep)">
                    {u.nome}
                  </div>
                </div>
                <div className="text-xs text-(--color-stencil) pl-1">{u.funcao}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grad-2 border-y-2 border-(--color-olive-deep) py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="stencil text-xs mb-2">SEÇÃO II · ESPECIALIZAÇÕES POR BIOMA</div>
          <h2 className="text-3xl md:text-4xl mb-3">Batalhões e Brigadas de Biomas</h2>
          <p className="text-(--color-stencil) mb-10 max-w-3xl">
            Conheça os batalhões e brigadas de especialização em biomas dentro da doutrina do
            Exército Brasileiro, replicados no CMF para operações em terrenos diversos.
          </p>

          <BrasaoImg
            src={BRASOES[4].src}
            alt={BRASOES[4].alt}
            className="w-full h-auto border-2 border-(--color-olive-deep) bg-(--color-khaki) p-3 mb-8"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {biomas.map((u, i) => (
              <div key={u.sigla} className="field-paper p-4 reveal" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="tag-rank mb-2">{u.sigla}</div>
                <div className="font-display text-sm text-(--color-olive-deep) tracking-wider mb-1">
                  {u.nome}
                </div>
                <div className="text-xs text-(--color-stencil)">
                  Bioma: <span className="font-bold">{u.bioma}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Suspense
        fallback={
          <section id="galeria" className="grad-4 py-16 text-(--color-khaki)">
            <div className="mx-auto max-w-6xl px-6 text-center font-mono text-sm opacity-70">
              Carregando galeria…
            </div>
          </section>
        }
      >
        <FotoGaleriaSection />
      </Suspense>

      <section className="grad-3 border-t-2 border-(--color-olive-deep) py-16 text-(--color-khaki)">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="stencil text-xs text-(--color-olive-bright) mb-2">AVISO INSTITUCIONAL</div>
          <p className="opacity-90">
            Todos os brasões e nomenclaturas são referências ao Exército Brasileiro, utilizadas
            no CMF exclusivamente para fins de imersão, entretenimento e roleplay dentro do FiveM.
          </p>
        </div>
      </section>
    </div>
  );
}
