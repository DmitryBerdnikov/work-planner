import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { auth } from "./auth/auth";
import { attachSession, type AppBindings } from "./auth/middleware";
import { env } from "./config/env";
import { appointmentsRoutes } from "./routes/appointments";
import { clientsRoutes } from "./routes/clients";
import { healthRoutes } from "./routes/health";
import { sessionRoutes } from "./routes/session";

export const app = new OpenAPIHono<AppBindings>();

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
app.route("/api", sessionRoutes);
app.route("/api", clientsRoutes);
app.route("/api", appointmentsRoutes);

app.doc("/api/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "Work Planner API",
    version: "0.1.0"
  }
});

if (env.NODE_ENV === "development" && env.APP_ENV === "development") {
  app.get("/api/docs", Scalar({
    pageTitle: "Work Planner API",
    url: "/api/openapi.json"
  }));
}

app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

export type AppType = typeof app;
