import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { apiErrorSchema, sessionResponseSchema } from "@work-planner/shared";
import { type ZodType } from "zod";
import { ensureProfileForUser } from "../auth/ensure-profile";
import { requireSession, type AppBindings } from "../auth/middleware";
import { db } from "../db/client";
import { profiles } from "../db/schema";

export const sessionRoutes = new OpenAPIHono<AppBindings>();

const apiErrorOpenApiSchema = sessionRoutes.openAPIRegistry.register("ApiError", apiErrorSchema);
const sessionResponseOpenApiSchema = sessionRoutes.openAPIRegistry.register("SessionResponse", sessionResponseSchema);

sessionRoutes.use("/session", requireSession);

const fetchSessionRoute = createRoute({
  method: "get",
  path: "/session",
  operationId: "fetchSession",
  tags: ["Session"],
  responses: {
    200: jsonResponse(sessionResponseOpenApiSchema, "Current session"),
    401: jsonResponse(apiErrorOpenApiSchema, "Unauthorized")
  }
});

sessionRoutes.openapi(fetchSessionRoute, async (c) => {
  const user = c.get("user")!;
  let profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id)
  });

  if (!profile) {
    profile = await ensureProfileForUser(user.id, user.email);
  }

  return c.json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image ?? null,
        emailVerified: user.emailVerified
      },
      profile: {
        status: profile.status,
        activatedAt: profile.activatedAt
      }
    },
    200
  );
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
