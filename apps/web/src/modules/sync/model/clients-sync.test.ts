import "fake-indexeddb/auto";
import Dexie from "dexie";
import type { Appointment, Client } from "@work-planner/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SyncPullResponse, SyncPushPayload, SyncPushResponse } from "@shared/api/generated/work-planner-api";
import { createWorkPlannerLocalDb, type WorkPlannerLocalDb } from "./local-db";
import { enqueueOutboxPatch } from "./outbox";
import { syncWorkPlanner } from "./work-planner-sync";

const databases: WorkPlannerLocalDb[] = [];

describe("work planner sync runner", () => {
  afterEach(async () => {
    await Promise.all(databases.splice(0).map(async (db) => {
      db.close();
      await Dexie.delete(db.name);
    }));
  });

  it("pushes pending client and appointment patches and marks them as synced", async () => {
    const db = createTestDb();
    const clientId = randomId();
    const patchId = randomId();
    const appointmentPatchId = randomId();
    await enqueueOutboxPatch(db, {
      id: patchId,
      entity: "client",
      entityId: clientId,
      operation: "create",
      changedFields: { name: "Анна" },
      baseRevision: 0,
      clientTimestamp: "2026-05-25T10:00:00.000Z"
    });
    await enqueueOutboxPatch(db, {
      id: appointmentPatchId,
      entity: "appointment",
      entityId: randomId(),
      operation: "update",
      changedFields: { title: "Сеанс" },
      baseRevision: 0,
      clientTimestamp: "2026-05-25T10:01:00.000Z"
    });
    const push = vi.fn(async (_payload: SyncPushPayload): Promise<SyncPushResponse> => ({
      applied: [{
        id: patchId,
        entity: "client",
        entityId: clientId,
        revision: 1,
        updatedAt: "2026-05-25T10:02:00.000Z"
      }]
    }));
    const pull = vi.fn(async (): Promise<SyncPullResponse> => emptyPullResponse("2026-05-25T10:03:00.000Z"));

    const result = await syncWorkPlanner({ db, api: { push, pull } });

    expect(result).toEqual({ status: "synced" });
    expect(push).toHaveBeenCalledWith({
      patches: [
        expect.objectContaining({ id: patchId, entity: "client", entityId: clientId }),
        expect.objectContaining({ id: appointmentPatchId, entity: "appointment" })
      ]
    });
    await expect(db.outbox.get(patchId)).resolves.toMatchObject({
      syncStatus: "synced",
      syncedAt: expect.any(String)
    });
    await expect(db.outbox.get(appointmentPatchId)).resolves.toMatchObject({
      syncStatus: "synced",
      syncedAt: expect.any(String)
    });
  });

  it("pulls clients and appointments into Dexie and stores the server timestamp", async () => {
    const db = createTestDb();
    const pulledClient = makeClient({ name: "Мария", revision: 3 });
    const pulledAppointment = makeAppointment({ title: "Эскиз", revision: 2 });
    const push = vi.fn(async (): Promise<SyncPushResponse> => ({ applied: [] }));
    const pull = vi.fn(async (): Promise<SyncPullResponse> => ({
      clients: [pulledClient],
      appointments: [pulledAppointment],
      serverTimestamp: "2026-05-25T12:00:00.000Z"
    }));

    const result = await syncWorkPlanner({ db, api: { push, pull } });

    expect(result).toEqual({ status: "synced" });
    expect(push).not.toHaveBeenCalled();
    await expect(db.clients.get(pulledClient.id)).resolves.toMatchObject({
      name: "Мария",
      revision: 3
    });
    await expect(db.appointments.get(pulledAppointment.id)).resolves.toMatchObject({
      title: "Эскиз",
      revision: 2
    });
    await expect(db.syncMeta.get("lastSuccessfulSyncAt")).resolves.toMatchObject({
      value: "2026-05-25T12:00:00.000Z"
    });
  });

  it("uses last successful sync timestamp when pulling changes", async () => {
    const db = createTestDb();
    await db.syncMeta.put({
      key: "lastSuccessfulSyncAt",
      value: "2026-05-25T09:00:00.000Z",
      updatedAt: "2026-05-25T09:00:00.000Z"
    });
    const push = vi.fn(async (): Promise<SyncPushResponse> => ({ applied: [] }));
    const pull = vi.fn(async (): Promise<SyncPullResponse> => emptyPullResponse("2026-05-25T12:00:00.000Z"));

    await syncWorkPlanner({ db, api: { push, pull } });

    expect(pull).toHaveBeenCalledWith({ since: "2026-05-25T09:00:00.000Z" });
  });

  it("returns failed and keeps pending patches when push fails", async () => {
    const db = createTestDb();
    const patchId = randomId();
    await enqueueOutboxPatch(db, {
      id: patchId,
      entity: "client",
      entityId: randomId(),
      operation: "update",
      changedFields: { name: "Анна К." },
      baseRevision: 1,
      clientTimestamp: "2026-05-25T10:00:00.000Z"
    });
    const push = vi.fn(async (): Promise<SyncPushResponse> => {
      throw new Error("network_error");
    });
    const pull = vi.fn(async (): Promise<SyncPullResponse> => emptyPullResponse("2026-05-25T12:00:00.000Z"));

    const result = await syncWorkPlanner({ db, api: { push, pull } });

    expect(result).toEqual({ status: "failed" });
    expect(pull).not.toHaveBeenCalled();
    await expect(db.outbox.get(patchId)).resolves.toMatchObject({ syncStatus: "pending" });
  });
});

function createTestDb(): WorkPlannerLocalDb {
  const db = createWorkPlannerLocalDb(`work-planner-sync-test-${randomId()}`);
  databases.push(db);
  return db;
}

function emptyPullResponse(serverTimestamp: string): SyncPullResponse {
  return {
    clients: [],
    appointments: [],
    serverTimestamp
  };
}

function makeClient(overrides: Partial<Client> = {}): Client {
  const timestamp = "2026-05-25T09:00:00.000Z";

  return {
    id: overrides.id ?? randomId(),
    userId: overrides.userId ?? randomId(),
    name: overrides.name ?? "Клиент",
    label: overrides.label ?? "",
    city: overrides.city ?? "",
    phone: overrides.phone ?? "",
    telegram: overrides.telegram ?? "",
    vk: overrides.vk ?? "",
    instagram: overrides.instagram ?? "",
    note: overrides.note ?? "",
    customData: overrides.customData ?? {},
    archivedAt: overrides.archivedAt ?? null,
    deletedAt: overrides.deletedAt ?? null,
    createdAt: overrides.createdAt ?? timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,
    revision: overrides.revision ?? 0
  };
}

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  const timestamp = "2026-05-25T09:00:00.000Z";

  return {
    id: overrides.id ?? randomId(),
    userId: overrides.userId ?? randomId(),
    clientId: overrides.clientId ?? null,
    startsAt: overrides.startsAt ?? "2026-05-26T10:00:00.000Z",
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
}

function randomId(): string {
  return globalThis.crypto.randomUUID();
}
