import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
