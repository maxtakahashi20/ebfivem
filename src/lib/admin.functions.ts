import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAccessKey } from "@/lib/access-key.server";

const AccessKeySchema = z.object({ accessKey: z.string() });

/** Login do painel: só confirma se a chave informada é a do servidor. */
export const validarChavePainel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AccessKeySchema.parse(input))
  .handler(async ({ data }) => {
    assertAccessKey(data.accessKey);
    return { ok: true };
  });

export const getPainelStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AccessKeySchema.parse(input))
  .handler(async ({ data }) => {
    assertAccessKey(data.accessKey);
    return {
      sistema: true,
      api: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    };
  });
