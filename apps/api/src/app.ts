import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth/auth.js";
import { attachSession, requireActiveProfile, type AppBindings } from "./auth/middleware.js";
import { env } from "./config/env.js";
import { clientsRoutes } from "./routes/clients.js";
import { healthRoutes } from "./routes/health.js";

export const app = new Hono<AppBindings>();

app.use(
  "*",
  cors({
    origin: env.WEB_ORIGIN,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    credentials: true,
    maxAge: 600
  })
);

app.use("*", attachSession);

app.route("/api", healthRoutes);
app.route("/api", clientsRoutes);

app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.get("/api/me", requireActiveProfile, (c) => {
  return c.json({ user: c.get("user") });
});

export type AppType = typeof app;
