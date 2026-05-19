import { createFileRoute, redirect } from "@tanstack/react-router";
import { queuePainelView } from "@/lib/painel-nav";

export const Route = createFileRoute("/identidade")({
  beforeLoad: () => {
    queuePainelView("perfil");
    throw redirect({ to: "/ADMCMF" });
  },
});
