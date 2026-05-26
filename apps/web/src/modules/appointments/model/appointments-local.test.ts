import "fake-indexeddb/auto";
import Dexie from "dexie";
import type { Appointment } from "@work-planner/shared";
import { afterEach, describe, expect, it } from "vitest";
import { createWorkPlannerLocalDb, type WorkPlannerLocalDb } from "@modules/sync";
import { mapFormToCreatePayload } from "./appointments-form";
import {
  cancelLocalAppointment,
  createLocalAppointment,
  listLocalAppointments,
  updateLocalAppointment
} from "./appointments-local";

const databases: WorkPlannerLocalDb[] = [];

describe("local appointments model", () => {
  afterEach(async () => {
    await Promise.all(databases.splice(0).map(async (db) => {
      db.close();
      await Dexie.delete(db.name);
    }));
  });

  it("creates a local appointment and stores a create patch in outbox", async () => {
    const db = createTestDb();

    const appointment = await createLocalAppointment({
      title: "Эскиз",
      startsAt: "2099-05-26T10:00:00.000Z",
      clientId: null,
      type: "work",
      sessionAmount: 120000,
      prepaymentAmount: 20000,
      note: "",
      customData: {}
    }, db);

    await expect(db.appointments.get(appointment.id)).resolves.toMatchObject({
      id: appointment.id,
      title: "Эскиз",
      clientId: null,
      status: "scheduled",
      deletedAt: null,
      revision: 0
    });
    await expect(db.outbox.orderBy("clientTimestamp").toArray()).resolves.toEqual([
      expect.objectContaining({
        entity: "appointment",
        entityId: appointment.id,
        operation: "create",
        changedFields: expect.objectContaining({
          title: "Эскиз",
          clientId: null,
          sessionAmount: 120000,
          prepaymentAmount: 20000
        }),
        baseRevision: 0,
        syncStatus: "pending",
        clientTimestamp: appointment.updatedAt
      })
    ]);
  });

  it("updates and cancels a local appointment with update patches", async () => {
    const db = createTestDb();
    const appointment = await seedAppointment(db, { title: "Эскиз", revision: 4 });

    const updated = await updateLocalAppointment({
      ...appointment,
      computedStatus: "scheduled"
    }, {
      title: "Консультация",
      startsAt: "2099-05-26T11:00:00.000Z",
      clientId: null,
      type: "personal",
      sessionAmount: 0,
      prepaymentAmount: 0,
      note: "без оплаты",
      customData: {}
    }, db);
    const cancelled = await cancelLocalAppointment(updated, db);

    await expect(db.appointments.get(appointment.id)).resolves.toMatchObject({
      title: "Консультация",
      status: "cancelled",
      updatedAt: cancelled.updatedAt,
      revision: 4
    });
    await expect(db.outbox.orderBy("clientTimestamp").toArray()).resolves.toEqual([
      expect.objectContaining({
        entity: "appointment",
        entityId: appointment.id,
        operation: "update",
        changedFields: expect.objectContaining({
          title: "Консультация",
          type: "personal"
        }),
        baseRevision: 4,
        clientTimestamp: updated.updatedAt
      }),
      expect.objectContaining({
        entity: "appointment",
        entityId: appointment.id,
        operation: "update",
        changedFields: { status: "cancelled" },
        baseRevision: 4,
        clientTimestamp: cancelled.updatedAt
      })
    ]);
  });

  it("lists visible appointments by range, order and computed status", async () => {
    const db = createTestDb();
    await seedAppointment(db, {
      title: "Позже",
      startsAt: "2099-05-26T12:00:00.000Z",
      createdAt: "2026-05-25T10:00:00.000Z"
    });
    await seedAppointment(db, {
      title: "Раньше",
      startsAt: "2099-05-26T10:00:00.000Z",
      createdAt: "2026-05-25T11:00:00.000Z"
    });
    await seedAppointment(db, {
      title: "Прошедшая",
      startsAt: "2026-05-25T10:00:00.000Z"
    });
    await seedAppointment(db, {
      title: "Удаленная",
      startsAt: "2099-05-26T11:00:00.000Z",
      deletedAt: "2026-05-25T12:00:00.000Z"
    });

    await expect(listLocalAppointments({
      from: "2099-05-26T00:00:00.000Z",
      to: "2099-05-27T00:00:00.000Z"
    }, db)).resolves.toEqual([
      expect.objectContaining({ title: "Раньше", computedStatus: "scheduled" }),
      expect.objectContaining({ title: "Позже", computedStatus: "scheduled" })
    ]);
    await expect(listLocalAppointments({}, db)).resolves.toEqual([
      expect.objectContaining({ title: "Прошедшая", computedStatus: "completed" }),
      expect.objectContaining({ title: "Раньше" }),
      expect.objectContaining({ title: "Позже" })
    ]);
  });

  it("maps form money fields to minor units for local create payloads", async () => {
    const db = createTestDb();
    const payload = mapFormToCreatePayload({
      title: "Новый сеанс",
      startsAtLocal: "2099-05-26T10:00",
      clientId: "",
      type: "work",
      sessionAmountRub: 1500,
      prepaymentAmountRub: 500,
      note: ""
    });

    const appointment = await createLocalAppointment(payload, db);

    expect(appointment).toMatchObject({
      clientId: null,
      sessionAmount: 150000,
      prepaymentAmount: 50000
    });
  });
});

function createTestDb(): WorkPlannerLocalDb {
  const db = createWorkPlannerLocalDb(`work-planner-appointments-test-${globalThis.crypto.randomUUID()}`);
  databases.push(db);
  return db;
}

async function seedAppointment(db: WorkPlannerLocalDb, overrides: Partial<Appointment>): Promise<Appointment> {
  const timestamp = "2026-05-25T09:00:00.000Z";
  const appointment: Appointment = {
    id: overrides.id ?? globalThis.crypto.randomUUID(),
    userId: overrides.userId ?? "550e8400-e29b-41d4-a716-446655440000",
    clientId: overrides.clientId ?? null,
    startsAt: overrides.startsAt ?? "2099-05-26T10:00:00.000Z",
    title: overrides.title ?? "Запись",
    type: overrides.type ?? "work",
    status: overrides.status ?? "scheduled",
    sessionAmount: overrides.sessionAmount ?? 100000,
    prepaymentAmount: overrides.prepaymentAmount ?? 0,
    note: overrides.note ?? "",
    customData: overrides.customData ?? {},
    deletedAt: overrides.deletedAt ?? null,
    createdAt: overrides.createdAt ?? timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,
    revision: overrides.revision ?? 0
  };

  await db.appointments.put(appointment);
  return appointment;
}
