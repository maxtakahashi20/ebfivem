export type FotoGaleria = {
  id: string;
  src: string;
  legenda: string;
};

export type GaleriaManifest = {
  generatedAt: string;
  count: number;
  photos: FotoGaleria[];
};

export const GALERIA_MANIFEST_URL = "/galeria/manifest.json";

export async function carregarManifestGaleria(): Promise<GaleriaManifest> {
  const res = await fetch(GALERIA_MANIFEST_URL, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Manifest da galeria indisponível (${res.status})`);
  }
  return res.json() as Promise<GaleriaManifest>;
}

export function fotosMarquee(fotos: FotoGaleria[], limit = 12): FotoGaleria[] {
  const destaques = fotos.filter((f) =>
    /vieira|infantaria|prec|comandos|content|mec/i.test(`${f.id} ${f.legenda}`),
  );
  const merged = [...destaques, ...fotos].filter(
    (f, i, arr) => arr.findIndex((x) => x.id === f.id) === i,
  );
  return merged.slice(0, limit);
}
