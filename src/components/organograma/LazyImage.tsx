import { useEffect, useRef, useState } from "react";

type LazyImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  /** Carrega imediatamente (ex.: marquee visível). */
  eager?: boolean;
};

export function LazyImage({ src, alt, className, sizes, eager = false }: LazyImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (eager) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "240px 0px", threshold: 0.01 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [eager]);

  return (
    <img
      ref={ref}
      src={visible ? src : undefined}
      data-src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      sizes={sizes}
      className={className}
    />
  );
}
