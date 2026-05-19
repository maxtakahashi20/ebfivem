import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import {
  Header,
  Footer,
  PanelBrandHeader,
  isPainelPath,
} from "@/components/site-chrome";
import { useRouterState } from "@tanstack/react-router";
import { MilitarySoundProvider } from "@/components/MilitarySoundProvider";

import appCss from "../styles.css?url";
import favicon from "../assets/cmf-logo.png?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="stamp text-(--color-destructive) mb-6">CLASSIFICADO</div>
        <h1 className="text-7xl font-display text-(--color-olive-deep)">404</h1>
        <h2 className="mt-4 text-xl">Posto avançado não localizado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Este setor não consta nos mapas operacionais.
        </p>
        <Link to="/" className="btn-olive inline-block mt-6">Retornar ao QG</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl">Falha de comunicação</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="btn-olive">
            Tentar novamente
          </button>
          <a href="/" className="btn-ghost-olive">QG</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Exército Brasileiro · Portal Oficial de Alistamento" },
      { name: "description", content: "Portal oficial do Exército Brasileiro. História, valores, missão e alistamento operacional." },
      { property: "og:title", content: "Exército Brasileiro · Portal Oficial de Alistamento" },
      { property: "og:description", content: "Portal oficial do Exército Brasileiro. História, valores, missão e alistamento operacional." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Exército Brasileiro · Portal Oficial de Alistamento" },
      { name: "twitter:description", content: "Portal oficial do Exército Brasileiro. História, valores, missão e alistamento operacional." },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: favicon },
      { rel: "apple-touch-icon", href: favicon },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto+Condensed:wght@300;400;700&family=Courier+Prime:wght@400;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const painel =
    isPainelPath(pathname) ||
    (typeof window !== "undefined" && isPainelPath(window.location.pathname));

  return (
    <QueryClientProvider client={queryClient}>
      {!painel && <MilitarySoundProvider />}
      <div className="min-h-screen flex flex-col">
        {painel ? <PanelBrandHeader /> : <Header />}
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer pathname={pathname} />
      </div>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
