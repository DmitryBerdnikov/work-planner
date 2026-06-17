import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { healthResponseSchema } from "@work-planner/shared";
import { env } from "../config/env.js";

export const healthRoutes = new OpenAPIHono();
const healthResponseOpenApiSchema = healthRoutes.openAPIRegistry.register("HealthResponse", healthResponseSchema);

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  operationId: "fetchHealth",
  tags: ["System"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: healthResponseOpenApiSchema
        }
      },
      description: "API health status"
    }
  }
});

healthRoutes.openapi(healthRoute, (c) => {
  return c.json({
    ok: true,
    environment: env.APP_ENV,
    version: "0.1.0"
  }, 200);
});
