import { randomUUID } from "node:crypto";
import {
  apiErrorSchema,
  clientIdParamsSchema,
  clientSchema,
  createClientPayloadSchema,
  listClientsQuerySchema,
  updateClientPayloadSchema,
  type Client
} from "@work-planner/shared";
import { createRoute, OpenAPIHono, type OpenAPIHonoOptions } from "@hono/zod-openapi";
import { and, asc, eq, isNull, or, sql, type AnyColumn, type SQL } from "drizzle-orm";
import { type Context } from "hono";
import { z, type ZodType } from "zod";
import { requireActiveProfile, type AppBindings } from "../auth/middleware.js";
import { db } from "../db/client.js";
import { clients } from "../db/schema.js";

type ClientRow = typeof clients.$inferSelect;
type ClientRouteContext = Context<AppBindings>;

const LIKE_ESCAPE = "\\";

const validationHook: OpenAPIHonoOptions<AppBindings>["defaultHook"] = (result, c) => {
  if (!result.success) {
    return c.json({ error: "validation_error", issues: result.error.issues }, 400);
  }
};

const clientsRoutes = new OpenAPIHono<AppBindings>({ defaultHook: validationHook });
const apiErrorOpenApiSchema = clientsRoutes.openAPIRegistry.register("ApiError", apiErrorSchema);
const clientOpenApiSchema = clientsRoutes.openAPIRegistry.register("Client", clientSchema);
const clientsResponseOpenApiSchema = clientsRoutes.openAPIRegistry.register(
  "ClientsResponse",
  z.object({ clients: z.array(clientOpenApiSchema) })
);
const clientResponseOpenApiSchema = clientsRoutes.openAPIRegistry.register(
  "ClientResponse",
  z.object({ client: clientOpenApiSchema })
);
const createClientPayloadOpenApiSchema = clientsRoutes.openAPIRegistry.register("CreateClientPayload", createClientPayloadSchema);
const updateClientPayloadOpenApiSchema = clientsRoutes.openAPIRegistry.register("UpdateClientPayload", updateClientPayloadSchema);

clientsRoutes.use("/clients", requireActiveProfile);
clientsRoutes.use("/clients/*", requireActiveProfile);

const listClientsRoute = createRoute({
  method: "get",
  path: "/clients",
  operationId: "fetchClients",
  tags: ["Clients"],
  request: {
    query: listClientsQuerySchema
  },
  responses: {
    200: jsonResponse(clientsResponseOpenApiSchema, "Clients list"),
    401: jsonResponse(apiErrorOpenApiSchema, "Unauthorized"),
    403: jsonResponse(apiErrorOpenApiSchema, "Account is not active")
  }
});

const createClientRoute = createRoute({
  method: "post",
  path: "/clients",
  operationId: "createClient",
  tags: ["Clients"],
  request: {
    body: jsonRequest(createClientPayloadOpenApiSchema)
  },
  responses: {
    201: jsonResponse(clientResponseOpenApiSchema, "Created client"),
    400: jsonResponse(apiErrorOpenApiSchema, "Validation error"),
    401: jsonResponse(apiErrorOpenApiSchema, "Unauthorized"),
    403: jsonResponse(apiErrorOpenApiSchema, "Account is not active")
  }
});

const updateClientRoute = createRoute({
  method: "patch",
  path: "/clients/{id}",
  operationId: "updateClient",
  tags: ["Clients"],
  request: {
    params: clientIdParamsSchema,
    body: jsonRequest(updateClientPayloadOpenApiSchema)
  },
  responses: {
    200: jsonResponse(clientResponseOpenApiSchema, "Updated client"),
    400: jsonResponse(apiErrorOpenApiSchema, "Validation error"),
    401: jsonResponse(apiErrorOpenApiSchema, "Unauthorized"),
    403: jsonResponse(apiErrorOpenApiSchema, "Account is not active"),
    404: jsonResponse(apiErrorOpenApiSchema, "Client not found"),
    500: jsonResponse(apiErrorOpenApiSchema, "Internal error")
  }
});

const archiveClientRoute = createRoute({
  method: "post",
  path: "/clients/{id}/archive",
  operationId: "archiveClient",
  tags: ["Clients"],
  request: {
    params: clientIdParamsSchema
  },
  responses: {
    200: jsonResponse(clientResponseOpenApiSchema, "Archived client"),
    401: jsonResponse(apiErrorOpenApiSchema, "Unauthorized"),
    403: jsonResponse(apiErrorOpenApiSchema, "Account is not active"),
    404: jsonResponse(apiErrorOpenApiSchema, "Client not found"),
    500: jsonResponse(apiErrorOpenApiSchema, "Internal error")
  }
});

const restoreClientRoute = createRoute({
  method: "post",
  path: "/clients/{id}/restore",
  operationId: "restoreClient",
  tags: ["Clients"],
  request: {
    params: clientIdParamsSchema
  },
  responses: {
    200: jsonResponse(clientResponseOpenApiSchema, "Restored client"),
    401: jsonResponse(apiErrorOpenApiSchema, "Unauthorized"),
    403: jsonResponse(apiErrorOpenApiSchema, "Account is not active"),
    404: jsonResponse(apiErrorOpenApiSchema, "Client not found"),
    500: jsonResponse(apiErrorOpenApiSchema, "Internal error")
  }
});

clientsRoutes.openapi(listClientsRoute, async (c) => {
  const userId = getUserId(c);
  const query = c.req.valid("query");
  const includeArchived = query.includeArchived === "true";

  const conditions: SQL[] = [
    eq(clients.userId, userId),
    isNull(clients.deletedAt)
  ];

  if (!includeArchived) {
    conditions.push(isNull(clients.archivedAt));
  }

  if (query.q) {
    const pattern = `%${escapeLikePattern(query.q)}%`;
    const searchCondition = or(
      likeColumn(clients.name, pattern),
      likeColumn(clients.label, pattern),
      likeColumn(clients.phone, pattern),
      likeColumn(clients.telegram, pattern)
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const rows = await db
    .select()
    .from(clients)
    .where(and(...conditions))
    .orderBy(asc(clients.name), asc(clients.createdAt));

  return c.json({ clients: rows.map(toClient) }, 200);
});

clientsRoutes.openapi(createClientRoute, async (c) => {
  const userId = getUserId(c);
  const payload = c.req.valid("json");
  const now = new Date().toISOString();
  const client: Client = {
    id: randomUUID(),
    userId,
    ...payload,
    archivedAt: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    revision: 0
  };

  await db.insert(clients).values(client);

  return c.json({ client }, 201);
});

clientsRoutes.openapi(updateClientRoute, async (c) => {
  const userId = getUserId(c);
  const { id } = c.req.valid("param");
  const existing = await findClient(userId, id);

  if (!existing) {
    return c.json({ error: "client_not_found" }, 404);
  }

  const payload = c.req.valid("json");
  const updatedAt = new Date().toISOString();
  const revision = existing.revision + 1;

  await db
    .update(clients)
    .set({
      ...payload,
      updatedAt,
      revision
    })
    .where(and(eq(clients.id, id), eq(clients.userId, userId), isNull(clients.deletedAt)));

  const updated = await findClient(userId, id);

  if (!updated) {
    return c.json({ error: "internal_error" }, 500);
  }

  return c.json({ client: toClient(updated) }, 200);
});

clientsRoutes.openapi(archiveClientRoute, async (c) => {
  const { id } = c.req.valid("param");
  return updateArchivedAt(c, id, new Date().toISOString());
});

clientsRoutes.openapi(restoreClientRoute, async (c) => {
  const { id } = c.req.valid("param");
  return updateArchivedAt(c, id, null);
});

function jsonRequest<TSchema extends ZodType>(schema: TSchema) {
  return {
    content: {
      "application/json": {
        schema
      }
    },
    required: true
  } as const;
}

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

async function updateArchivedAt(c: ClientRouteContext, id: string, archivedAt: string | null) {
  const userId = getUserId(c);
  const existing = await findClient(userId, id);

  if (!existing) {
    return c.json({ error: "client_not_found" }, 404);
  }

  const updatedAt = new Date().toISOString();
  const revision = existing.revision + 1;

  await db
    .update(clients)
    .set({ archivedAt, updatedAt, revision })
    .where(and(eq(clients.id, id), eq(clients.userId, userId), isNull(clients.deletedAt)));

  const updated = await findClient(userId, id);

  if (!updated) {
    return c.json({ error: "internal_error" }, 500);
  }

  return c.json({ client: toClient(updated) }, 200);
}

function getUserId(c: ClientRouteContext): string {
  return c.get("user")!.id;
}

function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, `${LIKE_ESCAPE}\\`).replace(/%/g, `${LIKE_ESCAPE}%`).replace(/_/g, `${LIKE_ESCAPE}_`);
}

function likeColumn(column: AnyColumn, pattern: string): SQL {
  return sql`${column} LIKE ${pattern} ESCAPE ${LIKE_ESCAPE}`;
}

async function findClient(userId: string, id: string): Promise<ClientRow | undefined> {
  return db.query.clients.findFirst({
    where: and(eq(clients.id, id), eq(clients.userId, userId), isNull(clients.deletedAt))
  });
}

function toClient(row: ClientRow): Client {
  return {
    ...row,
    customData: normalizeRecord(row.customData)
  };
}

function normalizeRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

export { clientsRoutes };
