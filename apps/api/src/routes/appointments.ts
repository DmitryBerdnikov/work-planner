import { randomUUID } from "node:crypto";
import {
  apiErrorSchema,
  appointmentIdParamsSchema,
  appointmentResponseSchema,
  appointmentsResponseSchema,
  createAppointmentPayloadSchema,
  getAppointmentComputedStatus,
  listAppointmentsQuerySchema,
  updateAppointmentPayloadSchema,
  type Appointment,
  type AppointmentWithComputedStatus,
  type CreateAppointmentPayload,
  type UpdateAppointmentPayload
} from "@work-planner/shared";
import { createRoute, OpenAPIHono, type OpenAPIHonoOptions } from "@hono/zod-openapi";
import { and, asc, eq, gte, isNull, lte, type SQL } from "drizzle-orm";
import { type Context } from "hono";
import { type ZodType } from "zod";
import { requireActiveProfile, type AppBindings } from "../auth/middleware";
import { db } from "../db/client";
import { appointments, clients } from "../db/schema";

type AppointmentRow = typeof appointments.$inferSelect;
type AppointmentRouteContext = Context<AppBindings>;

const validationHook: OpenAPIHonoOptions<AppBindings>["defaultHook"] = (result, c) => {
  if (!result.success) {
    return c.json({ error: "validation_error", issues: result.error.issues }, 400);
  }
};

const appointmentsRoutes = new OpenAPIHono<AppBindings>({ defaultHook: validationHook });
const apiErrorOpenApiSchema = appointmentsRoutes.openAPIRegistry.register("ApiError", apiErrorSchema);
const appointmentsResponseOpenApiSchema = appointmentsRoutes.openAPIRegistry.register(
  "AppointmentsResponse",
  appointmentsResponseSchema
);
const appointmentResponseOpenApiSchema = appointmentsRoutes.openAPIRegistry.register(
  "AppointmentResponse",
  appointmentResponseSchema
);
const createAppointmentPayloadOpenApiSchema = appointmentsRoutes.openAPIRegistry.register(
  "CreateAppointmentPayload",
  createAppointmentPayloadSchema
);
const updateAppointmentPayloadOpenApiSchema = appointmentsRoutes.openAPIRegistry.register(
  "UpdateAppointmentPayload",
  updateAppointmentPayloadSchema
);

appointmentsRoutes.use("/appointments", requireActiveProfile);
appointmentsRoutes.use("/appointments/*", requireActiveProfile);

const listAppointmentsRoute = createRoute({
  method: "get",
  path: "/appointments",
  operationId: "fetchAppointments",
  tags: ["Appointments"],
  request: {
    query: listAppointmentsQuerySchema
  },
  responses: {
    200: jsonResponse(appointmentsResponseOpenApiSchema, "Appointments list"),
    400: jsonResponse(apiErrorOpenApiSchema, "Validation error"),
    401: jsonResponse(apiErrorOpenApiSchema, "Unauthorized"),
    403: jsonResponse(apiErrorOpenApiSchema, "Account is not active")
  }
});

const createAppointmentRoute = createRoute({
  method: "post",
  path: "/appointments",
  operationId: "createAppointment",
  tags: ["Appointments"],
  request: {
    body: jsonRequest(createAppointmentPayloadOpenApiSchema)
  },
  responses: {
    201: jsonResponse(appointmentResponseOpenApiSchema, "Created appointment"),
    400: jsonResponse(apiErrorOpenApiSchema, "Validation error"),
    401: jsonResponse(apiErrorOpenApiSchema, "Unauthorized"),
    403: jsonResponse(apiErrorOpenApiSchema, "Account is not active"),
    404: jsonResponse(apiErrorOpenApiSchema, "Client not found")
  }
});

const updateAppointmentRoute = createRoute({
  method: "patch",
  path: "/appointments/{id}",
  operationId: "updateAppointment",
  tags: ["Appointments"],
  request: {
    params: appointmentIdParamsSchema,
    body: jsonRequest(updateAppointmentPayloadOpenApiSchema)
  },
  responses: {
    200: jsonResponse(appointmentResponseOpenApiSchema, "Updated appointment"),
    400: jsonResponse(apiErrorOpenApiSchema, "Validation error"),
    401: jsonResponse(apiErrorOpenApiSchema, "Unauthorized"),
    403: jsonResponse(apiErrorOpenApiSchema, "Account is not active"),
    404: jsonResponse(apiErrorOpenApiSchema, "Appointment or client not found"),
    500: jsonResponse(apiErrorOpenApiSchema, "Internal error")
  }
});

const cancelAppointmentRoute = createRoute({
  method: "post",
  path: "/appointments/{id}/cancel",
  operationId: "cancelAppointment",
  tags: ["Appointments"],
  request: {
    params: appointmentIdParamsSchema
  },
  responses: {
    200: jsonResponse(appointmentResponseOpenApiSchema, "Cancelled appointment"),
    401: jsonResponse(apiErrorOpenApiSchema, "Unauthorized"),
    403: jsonResponse(apiErrorOpenApiSchema, "Account is not active"),
    404: jsonResponse(apiErrorOpenApiSchema, "Appointment not found"),
    500: jsonResponse(apiErrorOpenApiSchema, "Internal error")
  }
});

appointmentsRoutes.openapi(listAppointmentsRoute, async (c) => {
  const userId = getUserId(c);
  const query = c.req.valid("query");
  const conditions: SQL[] = [
    eq(appointments.userId, userId),
    isNull(appointments.deletedAt)
  ];

  if (query.from) {
    conditions.push(gte(appointments.startsAt, normalizeDateTime(query.from)));
  }

  if (query.to) {
    conditions.push(lte(appointments.startsAt, normalizeDateTime(query.to)));
  }

  const rows = await db
    .select()
    .from(appointments)
    .where(and(...conditions))
    .orderBy(asc(appointments.startsAt), asc(appointments.createdAt));

  return c.json({ appointments: rows.map(toAppointment) }, 200);
});

appointmentsRoutes.openapi(createAppointmentRoute, async (c) => {
  const userId = getUserId(c);
  const payload = c.req.valid("json");

  if (payload.clientId && !(await hasClient(userId, payload.clientId))) {
    return c.json({ error: "client_not_found" }, 404);
  }

  const now = new Date().toISOString();
  const appointment: Appointment = {
    id: randomUUID(),
    userId,
    ...normalizeCreatePayload(payload),
    status: "scheduled",
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    revision: 0
  };

  await db.insert(appointments).values(appointment);

  return c.json({ appointment: toAppointment(appointment) }, 201);
});

appointmentsRoutes.openapi(updateAppointmentRoute, async (c) => {
  const userId = getUserId(c);
  const { id } = c.req.valid("param");
  const existing = await findAppointment(userId, id);

  if (!existing) {
    return c.json({ error: "appointment_not_found" }, 404);
  }

  const payload = c.req.valid("json");

  if (payload.clientId && !(await hasClient(userId, payload.clientId))) {
    return c.json({ error: "client_not_found" }, 404);
  }

  const nextSessionAmount = payload.sessionAmount ?? existing.sessionAmount;
  const nextPrepaymentAmount = payload.prepaymentAmount ?? existing.prepaymentAmount;

  if (nextPrepaymentAmount > nextSessionAmount) {
    return c.json({ error: "validation_error" }, 400);
  }

  const updatedAt = new Date().toISOString();
  const revision = existing.revision + 1;

  await db
    .update(appointments)
    .set({
      ...normalizeUpdatePayload(payload),
      updatedAt,
      revision
    })
    .where(and(eq(appointments.id, id), eq(appointments.userId, userId), isNull(appointments.deletedAt)));

  const updated = await findAppointment(userId, id);

  if (!updated) {
    return c.json({ error: "internal_error" }, 500);
  }

  return c.json({ appointment: toAppointment(updated) }, 200);
});

appointmentsRoutes.openapi(cancelAppointmentRoute, async (c) => {
  const userId = getUserId(c);
  const { id } = c.req.valid("param");
  const existing = await findAppointment(userId, id);

  if (!existing) {
    return c.json({ error: "appointment_not_found" }, 404);
  }

  if (existing.status === "cancelled") {
    return c.json({ appointment: toAppointment(existing) }, 200);
  }

  await db
    .update(appointments)
    .set({
      status: "cancelled",
      updatedAt: new Date().toISOString(),
      revision: existing.revision + 1
    })
    .where(and(eq(appointments.id, id), eq(appointments.userId, userId), isNull(appointments.deletedAt)));

  const updated = await findAppointment(userId, id);

  if (!updated) {
    return c.json({ error: "internal_error" }, 500);
  }

  return c.json({ appointment: toAppointment(updated) }, 200);
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

function getUserId(c: AppointmentRouteContext): string {
  return c.get("user")!.id;
}

async function findAppointment(userId: string, id: string): Promise<AppointmentRow | undefined> {
  return db.query.appointments.findFirst({
    where: and(eq(appointments.id, id), eq(appointments.userId, userId), isNull(appointments.deletedAt))
  });
}

async function hasClient(userId: string, id: string): Promise<boolean> {
  const client = await db.query.clients.findFirst({
    where: and(eq(clients.id, id), eq(clients.userId, userId), isNull(clients.deletedAt))
  });

  return Boolean(client);
}

function normalizeCreatePayload(payload: CreateAppointmentPayload): CreateAppointmentPayload {
  return {
    ...payload,
    clientId: payload.clientId ?? null,
    startsAt: normalizeDateTime(payload.startsAt)
  };
}

function normalizeUpdatePayload(payload: UpdateAppointmentPayload): Partial<Appointment> {
  const updatePayload: Partial<Appointment> = {
    clientId: payload.clientId,
    startsAt: payload.startsAt ? normalizeDateTime(payload.startsAt) : undefined,
    title: payload.title,
    type: payload.type,
    sessionAmount: payload.sessionAmount,
    prepaymentAmount: payload.prepaymentAmount,
    note: payload.note,
    customData: payload.customData
  };

  return Object.fromEntries(Object.entries(updatePayload).filter(([, value]) => value !== undefined)) as Partial<Appointment>;
}

function normalizeDateTime(value: string): string {
  return new Date(value).toISOString();
}

function toAppointment(row: AppointmentRow | Appointment): AppointmentWithComputedStatus {
  return {
    ...row,
    customData: normalizeRecord(row.customData),
    computedStatus: getAppointmentComputedStatus(row)
  };
}

function normalizeRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

export { appointmentsRoutes };
