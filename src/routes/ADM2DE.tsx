import { createFileRoute, redirect } from "@tanstack/react-router";

/** Endereço antigo do painel: mantém links salvos funcionando. */
export const Route = createFileRoute("/ADM2DE")({
  beforeLoad: () => {
    throw redirect({ to: "/painel", replace: true });
  },
});
