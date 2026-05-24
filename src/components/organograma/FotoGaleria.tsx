import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { LazyImage } from "@/components/organograma/LazyImage";
import {
  carregarManifestGaleria,
  fotosMarquee,
  type FotoGaleria,
} from "@/lib/organograma-galeria";

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const fallback = window.setTimeout(() => setVisivel(true), 600);
    if (!el) return () => clearTimeout(fallback);
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisivel(true);
          obs.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px 80px 0px" },
    );
    obs.observe(el);
    return () => {
      clearTimeout(fallback);
      obs.disconnect();
    };
  }, []);

  return { ref, visivel };
}

export function FotoGaleriaSection() {
  const { ref: secRef, visivel: secVisivel } = useReveal<HTMLElement>();
  const [fotos, setFotos] = useState<FotoGaleria[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<FotoGaleria | null>(null);
  const [indiceLb, setIndiceLb] = useState(0);

  useEffect(() => {
    let cancelled = false;
    carregarManifestGaleria()
      .then((m) => {
        if (!cancelled) setFotos(m.photos);
      })
      .catch((e) => {
        if (!cancelled) {
          setErro(e instanceof Error ? e.message : "Falha ao carregar galeria");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const marquee = useMemo(() => fotosMarquee(fotos, 12), [fotos]);
  const marqueeDuplo = useMemo(() => [...marquee, ...marquee], [marquee]);

  const abrir = useCallback(
    (foto: FotoGaleria) => {
      const idx = fotos.findIndex((f) => f.id === foto.id);
      setIndiceLb(idx >= 0 ? idx : 0);
      setLightbox(foto);
    },
    [fotos],
  );

  const fechar = () => setLightbox(null);

  const anterior = useCallback(() => {
    setIndiceLb((i) => {
      const next = (i - 1 + fotos.length) % fotos.length;
      setLightbox(fotos[next]);
      return next;
    });
  }, [fotos]);

  const proximo = useCallback(() => {
    setIndiceLb((i) => {
      const next = (i + 1) % fotos.length;
      setLightbox(fotos[next]);
      return next;
    });
  }, [fotos]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") proximo();
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, anterior, proximo]);

  if (loading) {
    return (
      <section id="galeria" className="grad-4 py-16 text-(--color-khaki) border-y-2 border-(--color-olive-deep)">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="stencil text-xs text-(--color-gold) mb-2">SEÇÃO III · REGISTRO FOTOGRÁFICO</p>
          <p className="font-mono text-sm opacity-70 animate-pulse">Carregando galeria…</p>
        </div>
      </section>
    );
  }

  if (erro || fotos.length === 0) {
    return (
      <section id="galeria" className="grad-4 py-16 text-(--color-khaki)">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="stencil text-xs text-(--color-gold) mb-2">GALERIA</p>
          <p className="font-mono text-sm opacity-70">{erro ?? "Nenhuma foto na galeria."}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="galeria"
      ref={secRef}
      className="grad-4 py-20 text-(--color-khaki) overflow-hidden border-y-2 border-(--color-olive-deep)"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <div className="stencil text-xs text-(--color-gold) mb-2">
            SEÇÃO III · REGISTRO FOTOGRÁFICO
          </div>
          <h2 className="font-display text-3xl md:text-5xl tracking-widest text-white mb-3">
            Galeria da Tropa
          </h2>
          <p className="max-w-2xl mx-auto text-sm opacity-80">
            Momentos de instrução, operações e presença em campo — a força do CMF em imagens.
            Clique para ampliar.
          </p>
          <p className="font-mono text-[10px] mt-3 opacity-60">
            {fotos.length} registros · imagens otimizadas WebP
          </p>
        </div>

        <div className="galeria-marquee-wrap mb-14 -mx-6 md:mx-0">
          <div className="galeria-marquee-track">
            {marqueeDuplo.map((foto, i) => (
              <button
                key={`${foto.id}-${i}`}
                type="button"
                onClick={() => abrir(foto)}
                className="galeria-marquee-item group shrink-0"
              >
                <LazyImage
                  src={foto.src}
                  alt={foto.legenda}
                  eager={i < 4}
                  sizes="220px"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <span className="galeria-marquee-shine" aria-hidden />
              </button>
            ))}
          </div>
        </div>

        <div
          className={`columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 transition-all duration-700 ${
            secVisivel ? "translate-y-0 opacity-100" : "opacity-100"
          }`}
        >
          {fotos.map((foto, i) => (
            <GaleriaCard key={foto.id} foto={foto} index={i} onAbrir={() => abrir(foto)} />
          ))}
        </div>
      </div>

      <Dialog open={!!lightbox} onOpenChange={(open) => !open && fechar()}>
        <DialogContent className="max-w-[min(96vw,1100px)] border-2 border-(--color-olive-deep) bg-(--color-olive-deep) p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {lightbox?.legenda ?? "Foto ampliada"}
          </DialogTitle>
          {lightbox && (
            <div className="relative">
              <img
                src={lightbox.src}
                alt={lightbox.legenda}
                className="w-full max-h-[80vh] object-contain bg-black/40 galeria-lightbox-enter"
              />
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent px-6 py-5">
                <p className="font-display tracking-widest text-(--color-khaki) text-lg">
                  {lightbox.legenda}
                </p>
                <p className="font-mono text-[10px] text-(--color-gold) mt-1">
                  {indiceLb + 1} / {fotos.length}
                </p>
              </div>
              <button
                type="button"
                onClick={fechar}
                className="absolute top-3 right-3 p-2 bg-black/50 text-white hover:bg-black/70 transition-colors"
                aria-label="Fechar"
              >
                <X className="size-5" />
              </button>
              <button
                type="button"
                onClick={anterior}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white hover:bg-(--color-olive-bright) transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={proximo}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white hover:bg-(--color-olive-bright) transition-colors"
                aria-label="Próxima"
              >
                <ChevronRight className="size-6" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function GaleriaCard({
  foto,
  index,
  onAbrir,
}: {
  foto: FotoGaleria;
  index: number;
  onAbrir: () => void;
}) {
  const atraso = `${Math.min(index * 0.04, 1.2)}s`;
  const destaque = index % 7 === 0;

  return (
    <article
      className={`galeria-card break-inside-avoid mb-4 galeria-card--visivel ${destaque ? "galeria-card--destaque" : ""}`}
      style={{ animationDelay: atraso }}
    >
      <button
        type="button"
        onClick={onAbrir}
        className="galeria-card-inner group w-full text-left focus-visible:outline-2 focus-visible:outline-(--color-gold)"
      >
        <div className="galeria-card-frame relative overflow-hidden">
          <LazyImage
            src={foto.src}
            alt={foto.legenda}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="w-full h-auto block transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <span className="galeria-card-scan" aria-hidden />
          <div className="galeria-card-overlay absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300">
            <span className="font-display text-xs tracking-widest text-white drop-shadow-md">
              {foto.legenda}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-mono text-(--color-gold) mt-1">
              <ZoomIn className="size-3" />
              AMPLIAR
            </span>
          </div>
          <div className="galeria-card-canto absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-(--color-gold) opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="galeria-card-canto absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-(--color-gold) opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>
    </article>
  );
}
