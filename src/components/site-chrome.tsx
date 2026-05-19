import { Link, useRouterState } from "@tanstack/react-router";
import logo from "@/assets/cmf-logo.png";
import { SfxToggle } from "@/components/SfxToggle";
import { PainelMembroButton } from "@/components/PainelMembroButton";

const DISCORD_URL = "https://discord.gg/F2T248Ytpj";

const links = [
  { to: "/", label: "Informativo" },
  { to: "/historia", label: "História" },
  { to: "/organograma", label: "Organograma" },
  { to: "/inscricao", label: "Alistamento" },
  { to: "/acompanhar", label: "Acompanhar" },
  { to: "/autoria", label: "Autoria" },
];

export function isPainelPath(pathname: string) {
  return /^\/admcmf(\/|$)/i.test(pathname);
}

function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img src={logo} alt="CMF" className="h-12 w-12 object-contain drop-shadow" />
      <div className="leading-tight">
        <div className="font-display text-xl tracking-widest text-(--color-olive-deep)">
          CMF
        </div>
        <div className="stencil text-[10px]">COMANDO MILITAR DO FIVEM</div>
      </div>
    </Link>
  );
}

/** Painel /ADMCMF: só logo + título (sem nav, Discord ou faixa). */
export function PanelBrandHeader() {
  return (
    <header className="border-b-2 border-(--color-olive-deep) bg-khaki/70 backdrop-blur supports-backdrop-filter:bg-khaki/60 sticky top-0 z-40 shrink-0">
      <div className="px-6 py-3">
        <BrandMark />
      </div>
    </header>
  );
}

/** Site público: header completo com navegação. */
export function Header() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="border-b-2 border-(--color-olive-deep) bg-khaki/70 backdrop-blur supports-backdrop-filter:bg-khaki/60 sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-6 py-3 flex items-center gap-6">
        <BrandMark />
        <nav className="ml-auto flex items-center gap-1 flex-wrap">
          {links.map((l) => {
            const active = path === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 font-display tracking-widest text-xs border-b-2 transition-colors ${
                  active
                    ? "border-(--color-olive-bright) text-(--color-olive-deep)"
                    : "border-transparent text-(--color-stencil) hover:text-(--color-olive-deep)"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <PainelMembroButton />
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-2 tag-rank bg-(--color-olive-bright) hover:opacity-90 shrink-0"
          >
            ◆ Discord
          </a>
        </nav>
      </div>
      <div className="divider-tape" />
    </header>
  );
}

export function Footer({ pathname }: { pathname: string }) {
  if (isPainelPath(pathname)) return null;

  return (
    <footer className="mt-24 border-t-2 border-(--color-olive-deep) bg-(--color-olive-deep) text-(--color-khaki)">
      <div className="mx-auto max-w-6xl px-6 py-10 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="font-display tracking-widest text-(--color-gold) mb-2">
            CMF · COMANDO MILITAR DO FIVEM
          </div>
          <p className="opacity-80">
            Comunidade milsim brasileira dentro do FiveM. Fundada em 8 de outubro de 2023.
          </p>
        </div>
        <div>
          <div className="font-display tracking-widest text-(--color-gold) mb-2">DOUTRINA</div>
          <ul className="space-y-1 opacity-80">
            <li>Disciplina</li>
            <li>Hierarquia</li>
            <li>Imersão</li>
            <li>Camaradagem</li>
          </ul>
        </div>
        <div>
          <div className="font-display tracking-widest text-(--color-gold) mb-2">COMUNICAÇÃO</div>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noreferrer"
            className="underline opacity-90 hover:opacity-100"
          >
            discord.gg/F2T248Ytpj
          </a>
          <p className="opacity-70 mt-2 text-xs">Canal oficial · Convocação 24h</p>
        </div>
        </div>
      <div className="text-center text-[10px] tracking-widest opacity-70 pb-6 px-4 space-y-2">
        <div className="flex justify-center">
          <SfxToggle />
        </div>
        <p>
          © {new Date().getFullYear()} CMF · COMANDO MILITAR DO FIVEM · DIREITOS RESERVADOS · USO
          FICTÍCIO
        </p>
      </div>
    </footer>
  );
}
