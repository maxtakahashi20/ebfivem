import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { queuePainelView } from "@/lib/painel-nav";

const searchSchema = z.object({
  protocolo: z.string().optional(),
});

export const Route = createFileRoute("/documentos")({
  validateSearch: (s) => searchSchema.parse(s),
  beforeLoad: ({ search }) => {
    queuePainelView("documentos", search.protocolo ? { protocolo: search.protocolo } : undefined);
    throw redirect({ to: "/ADMCMF" });
  },
});
