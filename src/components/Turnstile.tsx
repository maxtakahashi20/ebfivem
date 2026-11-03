import { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

/** Sem `VITE_TURNSTILE_SITE_KEY`, não mostra nada e o formulário segue normal. */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    const w = window as unknown as { turnstile?: TurnstileApi };
    let id: string | undefined;
    const render = () => {
      if (ref.current && w.turnstile) {
        id = w.turnstile.render(ref.current, { sitekey: SITE_KEY, callback: onToken });
      }
    };
    if (w.turnstile) render();
    else {
      const s = document.createElement("script");
      s.src = SCRIPT;
      s.onload = render;
      document.head.appendChild(s);
    }
    return () => {
      if (id) w.turnstile?.remove(id);
    };
  }, [onToken]);

  return SITE_KEY ? <div ref={ref} /> : null;
}
