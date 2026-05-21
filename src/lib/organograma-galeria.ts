/** Fotos operacionais do CMF (exclui brasões de batalhão e banner institucional). */
const EXCLUIR = new Set([
  "batalhoes-1.png",
  "batalhoes-2.png",
  "batalhoes-3.png",
  "batalhoes-4.png",
  "batalhoes-5.png",
  "cmf-banner.jpg",
]);

const LEGENDAS: Record<string, string> = {
  INFANTARIA_CMF1: "Infantaria · CMF",
  PREC_VIEIRA: "Precursores · CMF",
  vieirasniper: "Operador · Precursor",
  vieiracmds: "Comandos · Operações Especiais",
  veieeiraaaa: "Operações · CMF",
  mec3: "Equipe tática · CMF",
  content: "Operação conjunta",
  FullSizeRender: "Registro de campo",
  "Captura_de_tela_2024-07-03_193945": "Instrução · 2024",
};

const modulos = import.meta.glob<string>(
  [
    "../assets/*.png",
    "../assets/*.jpg",
    "../assets/*.jpeg",
    "../assets/*.PNG",
    "../assets/*.JPG",
    "../assets/*.JPEG",
  ],
  { eager: true, import: "default" },
);

function legendaDeArquivo(caminho: string): string {
  const base = caminho.split("/").pop()?.replace(/\.[^.]+$/i, "") ?? "";
  if (LEGENDAS[base]) return LEGENDAS[base];
  if (/^[0-9]+$/.test(base)) return "Registro operacional";
  if (/^A[0-9A-F-]{30,}$/i.test(base)) return "Operação CMF";
  return base
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

export type FotoGaleria = {
  id: string;
  src: string;
  legenda: string;
};

export const FOTOS_ORGANOGRAMA: FotoGaleria[] = Object.entries(modulos)
  .filter(([path]) => {
    const nome = path.split("/").pop() ?? "";
    return !EXCLUIR.has(nome) && !nome.startsWith("batalhoes-");
  })
  .map(([path, src]) => ({
    id: path,
    src,
    legenda: legendaDeArquivo(path),
  }))
  .sort((a, b) => a.legenda.localeCompare(b.legenda, "pt-BR"));

/** Subconjunto para faixa animada (destaques com nomes mais descritivos primeiro). */
export const FOTOS_MARQUEE: FotoGaleria[] = [
  ...FOTOS_ORGANOGRAMA.filter((f) =>
    /vieira|INFANTARIA|PREC|Comandos|content|mec/i.test(f.id),
  ),
  ...FOTOS_ORGANOGRAMA,
]
  .filter((f, i, arr) => arr.findIndex((x) => x.id === f.id) === i)
  .slice(0, 18);
