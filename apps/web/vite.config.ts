import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Work Planner",
        short_name: "Work Planner",
        description: "Local-first client and appointment planner.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#f7f2e8",
        background_color: "#f7f2e8",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//]
      }
    })
  ],
  resolve: {
    alias: {
      "@work-planner/shared": new URL("../../packages/shared/src/index.ts", import.meta.url).pathname,
      "@modules": new URL("./src/modules", import.meta.url).pathname,
      "@pages": new URL("./src/pages", import.meta.url).pathname,
      "@shared": new URL("./src/shared", import.meta.url).pathname
    }
  },
  server: {
    port: 5173
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["dist/**", "node_modules/**"]
  }
});
