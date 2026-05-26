import type { Appointment, AppointmentWithComputedStatus, CreateAppointmentPayload, UpdateAppointmentPayload } from "@work-planner/shared";
import { getAppointmentComputedStatus } from "@work-planner/shared";
import { enqueueOutboxPatch, localDb, type WorkPlannerLocalDb } from "@modules/sync";
import type { AppointmentsListParams } from "./appointments-queries";

const localUserId = "00000000-0000-0000-0000-000000000000";

export async function listLocalAppointments(
  params: AppointmentsListParams,
  db: WorkPlannerLocalDb = localDb
): Promise<AppointmentWithComputedStatus[]> {
  const appointments = await db.appointments.toArray();

  return appointments
    .filter((appointment) => appointment.deletedAt === null)
    .filter((appointment) => params.from === undefined || appointment.startsAt >= params.from)
    .filter((appointment) => params.to === undefined || appointment.startsAt < params.to)
    .sort(compareAppointments)
    .map(withComputedStatus);
}

export async function createLocalAppointment(
  payload: CreateAppointmentPayload,
  db: WorkPlannerLocalDb = localDb
): Promise<AppointmentWithComputedStatus> {
  const timestamp = new Date().toISOString();
  const changedFields = normalizeAppointmentPayload(payload);
  const appointment: Appointment = {
    id: globalThis.crypto.randomUUID(),
    userId: localUserId,
    ...changedFields,
    status: "scheduled",
    deletedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    revision: 0
  };

  await db.transaction("rw", db.appointments, db.outbox, async () => {
    await db.appointments.put(appointment);
    await enqueueOutboxPatch(db, {
      id: globalThis.crypto.randomUUID(),
      entity: "appointment",
      entityId: appointment.id,
      operation: "create",
      changedFields,
      baseRevision: 0,
      clientTimestamp: timestamp
    });
  });

  return withComputedStatus(appointment);
}

export async function updateLocalAppointment(
  appointment: AppointmentWithComputedStatus,
  payload: UpdateAppointmentPayload,
  db: WorkPlannerLocalDb = localDb
): Promise<AppointmentWithComputedStatus> {
  const timestamp = new Date().toISOString();
  const changedFields = normalizeAppointmentPayload(payload);
  const updatedAppointment: Appointment = {
    ...appointment,
    ...changedFields,
    updatedAt: timestamp
  };

  await updateAppointmentWithPatch(db, updatedAppointment, {
    changedFields,
    baseRevision: appointment.revision,
    clientTimestamp: timestamp
  });

  return withComputedStatus(updatedAppointment);
}

export async function cancelLocalAppointment(
  appointment: AppointmentWithComputedStatus,
  db: WorkPlannerLocalDb = localDb
): Promise<AppointmentWithComputedStatus> {
  const timestamp = new Date().toISOString();
  const updatedAppointment: Appointment = {
    ...appointment,
    status: "cancelled",
    updatedAt: timestamp
  };

  await updateAppointmentWithPatch(db, updatedAppointment, {
    changedFields: { status: "cancelled" },
    baseRevision: appointment.revision,
    clientTimestamp: timestamp
  });

  return withComputedStatus(updatedAppointment);
}

function normalizeAppointmentPayload(payload: CreateAppointmentPayload | UpdateAppointmentPayload): CreateAppointmentPayload {
  return {
    title: payload.title ?? "",
    startsAt: payload.startsAt ?? new Date().toISOString(),
    clientId: payload.clientId ?? null,
    type: payload.type ?? "work",
    sessionAmount: payload.sessionAmount ?? 0,
    prepaymentAmount: payload.prepaymentAmount ?? 0,
    note: payload.note ?? "",
    customData: payload.customData ?? {}
  };
}

async function updateAppointmentWithPatch(
  db: WorkPlannerLocalDb,
  appointment: Appointment,
  patch: {
    changedFields: Record<string, unknown>;
    baseRevision: number;
    clientTimestamp: string;
  }
): Promise<void> {
  await db.transaction("rw", db.appointments, db.outbox, async () => {
    await db.appointments.put(appointment);
    await enqueueOutboxPatch(db, {
      id: globalThis.crypto.randomUUID(),
      entity: "appointment",
      entityId: appointment.id,
      operation: "update",
      changedFields: patch.changedFields,
      baseRevision: patch.baseRevision,
      clientTimestamp: patch.clientTimestamp
    });
  });
}

function withComputedStatus(appointment: Appointment): AppointmentWithComputedStatus {
  return {
    ...appointment,
    customData: appointment.customData ?? {},
    note: appointment.note ?? "",
    computedStatus: getAppointmentComputedStatus(appointment)
  };
}

function compareAppointments(first: Appointment, second: Appointment): number {
  const byStartsAt = first.startsAt.localeCompare(second.startsAt);

  if (byStartsAt !== 0) {
    return byStartsAt;
  }

  return first.createdAt.localeCompare(second.createdAt);
}
