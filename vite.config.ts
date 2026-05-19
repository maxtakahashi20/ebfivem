import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

/** Expõe `.env` ao Worker local (Miniflare): entram como bindings e `server.ts` copia para `process.env`. */
function workerBindingsFromEnv(mode: string): Record<string, string> {
  const raw = loadEnv(mode, process.cwd(), "");
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.trim() !== "") env[key.trim()] = value.trim();
  }
  const out: Record<string, string> = {};
  const set = (key: string, value: string | undefined) => {
    if (value !== undefined && value !== "") out[key] = value;
  };

  set("SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY);
  set("ACCESS_KEY", env.ACCESS_KEY);
  set("SUPABASE_URL", env.SUPABASE_URL ?? env.VITE_SUPABASE_URL);
  set(
    "SUPABASE_PUBLISHABLE_KEY",
    env.SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );
  set("VITE_SUPABASE_URL", env.VITE_SUPABASE_URL);
  set("VITE_SUPABASE_PUBLISHABLE_KEY", env.VITE_SUPABASE_PUBLISHABLE_KEY);
  set("DISCORD_WEBHOOK_URL", env.DISCORD_WEBHOOK_URL);
  set("DISCORD_WEBHOOK_LOG_URL", env.DISCORD_WEBHOOK_LOG_URL);
  set("DISCORD_CLIENT_ID", env.DISCORD_CLIENT_ID);
  set("DISCORD_CLIENT_SECRET", env.DISCORD_CLIENT_SECRET);
  set("DISCORD_GUILD_ID", env.DISCORD_GUILD_ID);
  set("DISCORD_BOT_TOKEN", env.DISCORD_BOT_TOKEN);
  set("DISCORD_REDIRECT_URI", env.DISCORD_REDIRECT_URI);
  set("DISCORD_SESSION_SECRET", env.DISCORD_SESSION_SECRET);

  return out;
}

// TanStack Start + Cloudflare Workers — `.env` na raiz alimenta o Worker em dev/build via `vars`.
export default defineConfig(({ mode }) => ({
  server: {
    port: 8080,
    strictPort: true,
  },
  plugins: [
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    cloudflare({
      viteEnvironment: { name: "ssr" },
      config: () => ({
        vars: workerBindingsFromEnv(mode),
      }),
    }),
    tanstackStart({
      server: { entry: "server" },
      serverFns: {
        disableCsrfMiddlewareWarning: true,
      },
    }),
    viteReact(),
  ],
}));
