import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// TanStack Start + Nitro — deploy na Vercel (e outros hosts compatíveis com Nitro).
export default defineConfig({
  server: {
    port: 8080,
    strictPort: true,
  },
  plugins: [
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
      serverFns: {
        disableCsrfMiddlewareWarning: true,
      },
    }),
    viteReact(),
    nitro({
      preset: process.env.VERCEL ? "vercel" : "node-server",
    }),
  ],
});
