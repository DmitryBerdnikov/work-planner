import { Hono } from "hono";
import { env } from "../config/env.js";

export const healthRoutes = new Hono().get("/health", (c) => {
  return c.json({
    ok: true,
    environment: env.APP_ENV,
  });
});

