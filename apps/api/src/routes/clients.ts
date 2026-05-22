import { randomUUID } from "node:crypto";
import { createClientInputSchema, updateClientInputSchema, type Client } from "@work-planner/shared";
import { and, asc, eq, isNull, or, sql, type AnyColumn, type SQL } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { requireActiveProfile, type AppBindings } from "../auth/middleware.js";
import { db } from "../db/client.js";
import { clients } from "../db/schema.js";

type ClientRow = typeof clients.$inferSelect;
type ClientRouteContext = Context<AppBindings>;

const LIKE_ESCAPE = "\\";

const clientsRoutes = new Hono<AppBindings>();

clientsRoutes.use("*", requireActiveProfile);

clientsRoutes.get("/clients", async (c) => {
  const userId = getUserId(c);
  const query = c.req.query("q")?.trim();
  const includeArchived = c.req.query("includeArchived") === "true";

  const conditions: SQL[] = [
    eq(clients.userId, userId),
    isNull(clients.deletedAt)
  ];

  if (!includeArchived) {
    conditions.push(isNull(clients.archivedAt));
  }

  if (query) {
    const pattern = `%${escapeLikePattern(query)}%`;
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

  return c.json({ clients: rows.map(toClient) });
});

clientsRoutes.post("/clients", async (c) => {
  const userId = getUserId(c);
  const body = await readJson(c);
  const parsed = createClientInputSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "validation_error", issues: parsed.error.issues }, 400);
  }

  const now = new Date().toISOString();
  const client: Client = {
    id: randomUUID(),
    userId,
    ...parsed.data,
    archivedAt: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    revision: 0
  };

  await db.insert(clients).values(client);

  return c.json({ client }, 201);
});

clientsRoutes.patch("/clients/:id", async (c) => {
  const userId = getUserId(c);
  const id = c.req.param("id")!;
  const existing = await findClient(userId, id);

  if (!existing) {
    return c.json({ error: "client_not_found" }, 404);
  }

  const body = await readJson(c);
  const parsed = updateClientInputSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "validation_error", issues: parsed.error.issues }, 400);
  }

  const updatedAt = new Date().toISOString();
  const revision = existing.revision + 1;

  await db
    .update(clients)
    .set({
      ...parsed.data,
      updatedAt,
      revision
    })
    .where(and(eq(clients.id, id), eq(clients.userId, userId), isNull(clients.deletedAt)));

  const updated = await findClient(userId, id);

  if (!updated) {
    return c.json({ error: "internal_error" }, 500);
  }

  return c.json({ client: toClient(updated) });
});

clientsRoutes.post("/clients/:id/archive", async (c) => {
  return updateArchivedAt(c, new Date().toISOString());
});

clientsRoutes.post("/clients/:id/restore", async (c) => {
  return updateArchivedAt(c, null);
});

async function updateArchivedAt(c: ClientRouteContext, archivedAt: string | null) {
  const userId = getUserId(c);
  const id = c.req.param("id")!;
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

  return c.json({ client: toClient(updated) });
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

async function readJson(c: ClientRouteContext): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
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
