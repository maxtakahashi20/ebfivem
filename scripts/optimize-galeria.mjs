/**
 * Gera versões WebP otimizadas em public/galeria/ + public/brasoes/
 * e manifest.json para lazy-load no organograma.
 *
 * Uso: node scripts/optimize-galeria.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "src", "assets");
const GALERIA_OUT = path.join(ROOT, "public", "galeria");
const BRASOES_OUT = path.join(ROOT, "public", "brasoes");

const EXCLUIR_GALERIA = new Set([
  "batalhoes-1.png",
  "batalhoes-2.png",
  "batalhoes-3.png",
  "batalhoes-4.png",
  "batalhoes-5.png",
  "cmf-banner.jpg",
  "cmf-logo.png",
]);

const LEGENDAS = {
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

const IMG_EXT = /\.(png|jpe?g|webp)$/i;

function legenda(base) {
  if (LEGENDAS[base]) return LEGENDAS[base];
  if (/^[0-9]+$/.test(base)) return "Registro operacional";
  if (/^A[0-9A-F-]{30,}$/i.test(base)) return "Operação CMF";
  return base
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(base) {
  return base.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "foto";
}

async function toWebp(inputPath, outputPath, maxWidth) {
  const buf = await sharp(inputPath)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
  await fs.writeFile(outputPath, buf);
  return buf.length;
}

async function main() {
  await fs.mkdir(GALERIA_OUT, { recursive: true });
  await fs.mkdir(BRASOES_OUT, { recursive: true });

  const files = await fs.readdir(ASSETS);
  const photos = [];
  let totalIn = 0;
  let totalOut = 0;

  for (const file of files) {
    if (!IMG_EXT.test(file)) continue;

    const inputPath = path.join(ASSETS, file);
    const stat = await fs.stat(inputPath);
    totalIn += stat.size;

    const base = file.replace(/\.[^.]+$/i, "");

    if (file.startsWith("batalhoes-")) {
      const outName = `${base}.webp`;
      const outPath = path.join(BRASOES_OUT, outName);
      const size = await toWebp(inputPath, outPath, 1400);
      totalOut += size;
      console.log(`brasoes  ${file} → ${outName} (${(size / 1024).toFixed(0)} KB)`);
      continue;
    }

    if (EXCLUIR_GALERIA.has(file)) continue;

    const outName = `${slug(base)}.webp`;
    const outPath = path.join(GALERIA_OUT, outName);
    const size = await toWebp(inputPath, outPath, 1280);
    totalOut += size;
    photos.push({
      id: base,
      src: `/galeria/${outName}`,
      legenda: legenda(base),
    });
    console.log(`galeria  ${file} → ${outName} (${(size / 1024).toFixed(0)} KB)`);
  }

  photos.sort((a, b) => a.legenda.localeCompare(b.legenda, "pt-BR"));

  const manifest = {
    generatedAt: new Date().toISOString(),
    count: photos.length,
    photos,
  };

  await fs.writeFile(
    path.join(GALERIA_OUT, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  console.log(`\n✓ ${photos.length} fotos · ${(totalIn / 1024 / 1024).toFixed(1)} MB → ${(totalOut / 1024 / 1024).toFixed(1)} MB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
