import { createFileRoute } from "@tanstack/react-router";
import { PerfilMilitar } from "@/components/military/PerfilMilitar";

export const Route = createFileRoute("/identidade")({
  head: () => ({
    meta: [
      { title: "Identidade Militar · 2ª DE" },
      { name: "description", content: "Consulte sua carteira militar digital com protocolo e RG." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <PerfilMilitar />
    </div>
  ),
});
