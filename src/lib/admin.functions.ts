import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { exigirPapel } from "@/lib/painel-auth.server";

function hasWebhook(url: string | undefined) {
  const u = url?.trim();
  return !!u && /^https:\/\/discord\.com\/api\/webhooks\/\d+\/.+$/i.test(u);
}

export const getPainelStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ session: z.string() }).parse(input))
  .handler(async ({ data }) => {
    await exigirPapel(data.session, "membro");

    return {
      bot: !!process.env.DISCORD_BOT_TOKEN?.trim(),
      webhook: hasWebhook(process.env.DISCORD_WEBHOOK_URL),
    };
  });
