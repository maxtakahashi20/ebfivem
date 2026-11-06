import { Link, useRouterState } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import logo from "@/assets/logo-2de.png";

const DISCORD_URL = "https://discord.gg/2TETa9Z4Fu";

const links = [
  { to: "/", label: "Informativo" },
  { to: "/historia", label: "História" },
  { to: "/organograma", label: "Organograma" },
  { to: "/inscricao", label: "Alistamento" },
  { to: "/acompanhar", label: "Acompanhar" },
  { to: "/suporte", label: "Suporte" },
  { to: "/autoria", label: "Autoria" },
];

export function isPainelPath(pathname: string) {
  return /^\/(painel|adm2de)(\/|$)/i.test(pathname);
}

/** Site público: header completo com navegação. */
export function Header() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 bg-night/95 backdrop-blur border-b border-(--color-olive)/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-10 h-20 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src={logo} alt="2ª DE" className="h-11 w-11 object-contain" />
          <div className="leading-tight">
            <div className="font-display text-xl font-semibold tracking-[0.15em] text-sand">2ª DE</div>
            <div className="font-mono text-[10px] tracking-[0.15em] text-field">2ª DIVISÃO DO EXÉRCITO</div>
          </div>
        </Link>
        <nav className="ml-auto hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`font-display text-[13px] tracking-[0.15em] uppercase transition-colors ${
                path === l.to ? "text-field" : "text-sand/70 hover:text-sand"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noreferrer"
          className="ml-auto lg:ml-0 inline-flex items-center gap-2 bg-field px-4 py-2.5 font-display text-[13px] font-semibold tracking-[0.15em] text-night hover:brightness-110 shrink-0"
        >
          <MessageSquare className="h-4 w-4" /> DISCORD
        </a>
      </div>
      <nav className="lg:hidden flex gap-6 overflow-x-auto px-4 pb-3 sm:px-10">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`shrink-0 font-display text-xs tracking-[0.15em] uppercase ${
              path === l.to ? "text-field" : "text-sand/70"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

const footerCols = [
  { h: "PORTAL", items: links.slice(0, 3) },
  { h: "CONSCRITO", items: links.slice(3, 6) },
];

export function Footer({ pathname }: { pathname: string }) {
  if (isPainelPath(pathname)) return null;

  return (
    <footer className="bg-night text-sand">
      <div className="mx-auto max-w-7xl px-4 sm:px-10 pt-14 pb-8 flex flex-col gap-10">
        <div className="flex flex-col md:flex-row md:justify-between gap-10">
          <div className="max-w-sm flex flex-col gap-4">
            <img src={logo} alt="2ª DE" className="h-14 w-14 object-contain" />
            <p className="text-sm leading-relaxed text-sand/70">
              Comunidade milsim no FiveM. Hierarquia, disciplina e imersão desde 8 de outubro de 2023.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 md:gap-16">
            {footerCols.map((c) => (
              <div key={c.h} className="flex flex-col gap-3">
                <div className="font-mono text-[11px] tracking-[0.2em] text-field">{c.h}</div>
                {c.items.map((l) => (
                  <Link key={l.to} to={l.to} className="text-[15px] hover:text-bone">{l.label}</Link>
                ))}
              </div>
            ))}
            <div className="flex flex-col gap-3">
              <div className="font-mono text-[11px] tracking-[0.2em] text-field">OFICIAL</div>
              <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="text-[15px] hover:text-bone">Discord</a>
              <Link to="/autoria" className="text-[15px] hover:text-bone">Autoria</Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-5 border-t border-(--color-olive)/50 font-mono text-[11px] tracking-wider text-sand/50">
          <span>© {new Date().getFullYear()} 2ª DE · TODOS OS DIREITOS RESERVADOS</span>
          <span>COMUNIDADE FICTÍCIA · SEM VÍNCULO COM O EXÉRCITO BRASILEIRO</span>
        </div>
      </div>
    </footer>
  );
}
