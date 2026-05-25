import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { apiErrorSchema, currentUserResponseSchema } from "@work-planner/shared";
import { type ZodType } from "zod";
import { requireActiveProfile, type AppBindings } from "../auth/middleware";

export const sessionRoutes = new OpenAPIHono<AppBindings>();

const apiErrorOpenApiSchema = sessionRoutes.openAPIRegistry.register("ApiError", apiErrorSchema);
const currentUserResponseOpenApiSchema = sessionRoutes.openAPIRegistry.register(
  "CurrentUserResponse",
  currentUserResponseSchema
);

sessionRoutes.use("/me", requireActiveProfile);

const fetchCurrentUserRoute = createRoute({
  method: "get",
  path: "/me",
  operationId: "fetchCurrentUser",
  tags: ["Session"],
  responses: {
    200: jsonResponse(currentUserResponseOpenApiSchema, "Current user"),
    401: jsonResponse(apiErrorOpenApiSchema, "Unauthorized"),
    403: jsonResponse(apiErrorOpenApiSchema, "Account is not active")
  }
});

sessionRoutes.openapi(fetchCurrentUserRoute, (c) => {
  return c.json({ user: c.get("user")! }, 200);
});

function jsonResponse<TSchema extends ZodType>(schema: TSchema, description: string) {
  return {
    content: {
      "application/json": {
        schema
      }
    },
    description
  } as const;
}
