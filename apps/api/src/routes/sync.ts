import {
  apiErrorSchema,
  appointmentTypeSchema,
  appointmentStoredStatusSchema,
  createAppointmentPayloadSchema,
  createClientPayloadSchema,
  isoDateTimeSchema,
  moneyAmountSchema,
  syncPullQuerySchema,
  syncPullResponseSchema,
  syncPushPayloadSchema,
  syncPushResponseSchema,
  updateClientPayloadSchema,
  uuidSchema,
  type Appointment,
  type Client,
  type SyncAppliedPatch,
  type SyncPatch
} from "@work-planner/shared";
import { createRoute, OpenAPIHono, type OpenAPIHonoOptions } from "@hono/zod-openapi";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { type Context } from "hono";
import { z, type ZodType } from "zod";
import { requireActiveProfile, type AppBindings } from "../auth/middleware";
import { db } from "../db/client";
import { appointments, clients } from "../db/schema";

type ClientRow = typeof clients.$inferSelect;
type AppointmentRow = typeof appointments.$inferSelect;
type SyncRouteContext = Context<AppBindings>;

const validationHook: OpenAPIHonoOptions<AppBindings>["defaultHook"] = (result, c) => {
  if (!result.success) {
    return c.json({ error: "validation_error", issues: result.error.issues }, 400);
  }
};

const appointmentSyncUpdatePayloadSchema = z.object({
  clientId: uuidSchema.nullable().optional(),
  startsAt: isoDateTimeSchema.optional(),
  title: z.string().trim().min(1).optional(),
  type: appointmentTypeSchema.optional(),
  status: appointmentStoredStatusSchema.optional(),
  sessionAmount: moneyAmountSchema.optional(),
  prepaymentAmount: moneyAmountSchema.optional(),
  note: z.string().trim().optional(),
  customData: z.record(z.string(), z.unknown()).optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided"
}).refine((value) => {
  if (value.sessionAmount === undefined || value.prepaymentAmount === undefined) {
    return true;
  }

  return value.prepaymentAmount <= value.sessionAmount;
}, {
  message: "prepaymentAmount must not exceed sessionAmount",
  path: ["prepaymentAmount"]
});

const syncRoutes = new OpenAPIHono<AppBindings>({ defaultHook: validationHook });
const apiErrorOpenApiSchema = syncRoutes.openAPIRegistry.register("ApiError", apiErrorSchema);
const syncPushPayloadOpenApiSchema = syncRoutes.openAPIRegistry.register("SyncPushPayload", syncPushPayloadSchema);
const syncPushResponseOpenApiSchema = syncRoutes.openAPIRegistry.register("SyncPushResponse", syncPushResponseSchema);
const syncPullResponseOpenApiSchema = syncRoutes.openAPIRegistry.register("SyncPullResponse", syncPullResponseSchema);

syncRoutes.use("/sync/push", requireActiveProfile);
syncRoutes.use("/sync/pull", requireActiveProfile);

const pushSyncRoute = createRoute({
  method: "post",
  path: "/sync/push",
  operationId: "pushSync",
  tags: ["Sync"],
  request: {
    body: jsonRequest(syncPushPayloadOpenApiSchema)
  },
  responses: {
    200: jsonResponse(syncPushResponseOpenApiSchema, "Applied sync patches"),
    400: jsonResponse(apiErrorOpenApiSchema, "Validation error"),
    401: jsonResponse(apiErrorOpenApiSchema, "Unauthorized"),
    403: jsonResponse(apiErrorOpenApiSchema, "Account is not active"),
    404: jsonResponse(apiErrorOpenApiSchema, "Synced entity not found")
  }
});

const pullSyncRoute = createRoute({
  method: "get",
  path: "/sync/pull",
  operationId: "pullSync",
  tags: ["Sync"],
  request: {
    query: syncPullQuerySchema
  },
  responses: {
    200: jsonResponse(syncPullResponseOpenApiSchema, "Changed sync entities"),
    400: jsonResponse(apiErrorOpenApiSchema, "Validation error"),
    401: jsonResponse(apiErrorOpenApiSchema, "Unauthorized"),
    403: jsonResponse(apiErrorOpenApiSchema, "Account is not active")
  }
});

syncRoutes.openapi(pushSyncRoute, async (c) => {
  const userId = getUserId(c);
  const { patches } = c.req.valid("json");
  const applied: SyncAppliedPatch[] = [];

  for (const patch of patches) {
    const result = await applyPatch(userId, patch);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    applied.push(result.applied);
  }

  return c.json({ applied }, 200);
});

syncRoutes.openapi(pullSyncRoute, async (c) => {
  const userId = getUserId(c);
  const { since } = c.req.valid("query");
  const sinceTimestamp = since ?? new Date(0).toISOString();

  const changedClients = await db
    .select()
    .from(clients)
    .where(and(eq(clients.userId, userId), gt(clients.updatedAt, sinceTimestamp)))
    .orderBy(asc(clients.updatedAt), asc(clients.createdAt));

  const changedAppointments = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.userId, userId), gt(appointments.updatedAt, sinceTimestamp)))
    .orderBy(asc(appointments.updatedAt), asc(appointments.createdAt));

  return c.json({
    clients: changedClients.map(toClient),
    appointments: changedAppointments.map(toAppointment),
    serverTimestamp: new Date().toISOString()
  }, 200);
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

async function applyPatch(userId: string, patch: SyncPatch): Promise<ApplyPatchResult> {
  if (patch.entity === "client") {
    return applyClientPatch(userId, patch);
  }

  return applyAppointmentPatch(userId, patch);
}

async function applyClientPatch(userId: string, patch: SyncPatch): Promise<ApplyPatchResult> {
  const existingById = await findClientById(patch.entityId);

  if (existingById && existingById.userId !== userId) {
    return { success: false, status: 404, error: "sync_entity_not_found" };
  }

  if (patch.operation === "create") {
    const parsed = createClientPayloadSchema.safeParse(patch.changedFields);

    if (!parsed.success) {
      return { success: false, status: 400, error: "validation_error" };
    }

    const now = new Date().toISOString();

    if (existingById) {
      const revision = existingById.revision + 1;
      await db
        .update(clients)
        .set({ ...parsed.data, deletedAt: null, updatedAt: now, revision })
        .where(and(eq(clients.id, patch.entityId), eq(clients.userId, userId)));

      return { success: true, applied: appliedPatch(patch, revision, now) };
    }

    await db.insert(clients).values({
      id: patch.entityId,
      userId,
      ...parsed.data,
      archivedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      revision: 0
    });

    return { success: true, applied: appliedPatch(patch, 0, now) };
  }

  if (!existingById) {
    return { success: false, status: 404, error: "sync_entity_not_found" };
  }

  const now = new Date().toISOString();
  const revision = existingById.revision + 1;

  if (patch.operation === "delete") {
    await db
      .update(clients)
      .set({ deletedAt: now, updatedAt: now, revision })
      .where(and(eq(clients.id, patch.entityId), eq(clients.userId, userId)));

    return { success: true, applied: appliedPatch(patch, revision, now) };
  }

  const parsed = updateClientPayloadSchema.safeParse(patch.changedFields);

  if (!parsed.success) {
    return { success: false, status: 400, error: "validation_error" };
  }

  await db
    .update(clients)
    .set({ ...parsed.data, updatedAt: now, revision })
    .where(and(eq(clients.id, patch.entityId), eq(clients.userId, userId), isNull(clients.deletedAt)));

  return { success: true, applied: appliedPatch(patch, revision, now) };
}

async function applyAppointmentPatch(userId: string, patch: SyncPatch): Promise<ApplyPatchResult> {
  const existingById = await findAppointmentById(patch.entityId);

  if (existingById && existingById.userId !== userId) {
    return { success: false, status: 404, error: "sync_entity_not_found" };
  }

  if (patch.operation === "create") {
    const parsed = createAppointmentPayloadSchema.safeParse(patch.changedFields);
    const parsedStatus = appointmentStoredStatusSchema.optional().default("scheduled").safeParse(patch.changedFields.status);

    if (!parsed.success || !parsedStatus.success) {
      return { success: false, status: 400, error: "validation_error" };
    }

    if (parsed.data.clientId && !(await hasClient(userId, parsed.data.clientId))) {
      return { success: false, status: 404, error: "client_not_found" };
    }

    const now = new Date().toISOString();
    const values = {
      ...normalizeCreateAppointmentPayload(parsed.data),
      status: parsedStatus.data
    };

    if (existingById) {
      const revision = existingById.revision + 1;
      await db
        .update(appointments)
        .set({ ...values, deletedAt: null, updatedAt: now, revision })
        .where(and(eq(appointments.id, patch.entityId), eq(appointments.userId, userId)));

      return { success: true, applied: appliedPatch(patch, revision, now) };
    }

    await db.insert(appointments).values({
      id: patch.entityId,
      userId,
      ...values,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      revision: 0
    });

    return { success: true, applied: appliedPatch(patch, 0, now) };
  }

  if (!existingById) {
    return { success: false, status: 404, error: "sync_entity_not_found" };
  }

  const now = new Date().toISOString();
  const revision = existingById.revision + 1;

  if (patch.operation === "delete") {
    await db
      .update(appointments)
      .set({ deletedAt: now, updatedAt: now, revision })
      .where(and(eq(appointments.id, patch.entityId), eq(appointments.userId, userId)));

    return { success: true, applied: appliedPatch(patch, revision, now) };
  }

  const parsed = appointmentSyncUpdatePayloadSchema.safeParse(patch.changedFields);

  if (!parsed.success) {
    return { success: false, status: 400, error: "validation_error" };
  }

  if (parsed.data.clientId && !(await hasClient(userId, parsed.data.clientId))) {
    return { success: false, status: 404, error: "client_not_found" };
  }

  const nextSessionAmount = parsed.data.sessionAmount ?? existingById.sessionAmount;
  const nextPrepaymentAmount = parsed.data.prepaymentAmount ?? existingById.prepaymentAmount;

  if (nextPrepaymentAmount > nextSessionAmount) {
    return { success: false, status: 400, error: "validation_error" };
  }

  await db
    .update(appointments)
    .set({ ...normalizeUpdateAppointmentPayload(parsed.data), updatedAt: now, revision })
    .where(and(eq(appointments.id, patch.entityId), eq(appointments.userId, userId), isNull(appointments.deletedAt)));

  return { success: true, applied: appliedPatch(patch, revision, now) };
}

function getUserId(c: SyncRouteContext): string {
  return c.get("user")!.id;
}

async function findClientById(id: string): Promise<ClientRow | undefined> {
  return db.query.clients.findFirst({
    where: eq(clients.id, id)
  });
}

async function findAppointmentById(id: string): Promise<AppointmentRow | undefined> {
  return db.query.appointments.findFirst({
    where: eq(appointments.id, id)
  });
}

async function hasClient(userId: string, id: string): Promise<boolean> {
  const client = await db.query.clients.findFirst({
    where: and(eq(clients.id, id), eq(clients.userId, userId), isNull(clients.deletedAt))
  });

  return Boolean(client);
}

function normalizeCreateAppointmentPayload(payload: z.infer<typeof createAppointmentPayloadSchema>) {
  return {
    ...payload,
    clientId: payload.clientId ?? null,
    startsAt: normalizeDateTime(payload.startsAt)
  };
}

function normalizeUpdateAppointmentPayload(payload: z.infer<typeof appointmentSyncUpdatePayloadSchema>): Partial<Appointment> {
  return Object.fromEntries(Object.entries({
    ...payload,
    startsAt: payload.startsAt ? normalizeDateTime(payload.startsAt) : undefined
  }).filter(([, value]) => value !== undefined)) as Partial<Appointment>;
}

function normalizeDateTime(value: string): string {
  return new Date(value).toISOString();
}

function appliedPatch(patch: SyncPatch, revision: number, updatedAt: string): SyncAppliedPatch {
  return {
    id: patch.id,
    entity: patch.entity,
    entityId: patch.entityId,
    revision,
    updatedAt
  };
}

function toClient(row: ClientRow): Client {
  return {
    ...row,
    customData: normalizeRecord(row.customData)
  };
}

function toAppointment(row: AppointmentRow): Appointment {
  return {
    ...row,
    customData: normalizeRecord(row.customData),
    status: row.status ?? "scheduled"
  };
}

function normalizeRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

type ApplyPatchResult =
  | { success: true; applied: SyncAppliedPatch }
  | { success: false; status: 400 | 404; error: string };

export { syncRoutes };
