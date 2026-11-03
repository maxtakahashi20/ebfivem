import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAccessKey } from "@/lib/access-key.server";

function hasWebhook(url: string | undefined) {
  const u = url?.trim();
  return !!u && /^https:\/\/discord\.com\/api\/webhooks\/\d+\/.+$/i.test(u);
}

export const getPainelStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ accessKey: z.string() }).parse(input))
  .handler(async ({ data }) => {
    assertAccessKey(data.accessKey);

    return {
      sistema: true,
      discord: hasWebhook(process.env.DISCORD_WEBHOOK_URL),
      api: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      webhook: hasWebhook(process.env.DISCORD_WEBHOOK_URL),
    };
  });
