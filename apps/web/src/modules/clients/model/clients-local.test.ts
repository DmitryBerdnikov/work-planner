import "fake-indexeddb/auto";
import Dexie from "dexie";
import type { Client } from "@work-planner/shared";
import { afterEach, describe, expect, it } from "vitest";
import { createWorkPlannerLocalDb, type WorkPlannerLocalDb } from "@modules/sync";
import {
  archiveLocalClient,
  createLocalClient,
  listLocalClients,
  restoreLocalClient,
  updateLocalClient
} from "./clients-local";

const databases: WorkPlannerLocalDb[] = [];

describe("local clients model", () => {
  afterEach(async () => {
    await Promise.all(databases.splice(0).map(async (db) => {
      db.close();
      await Dexie.delete(db.name);
    }));
  });

  it("creates a local client and stores a create patch in outbox", async () => {
    const db = createTestDb();

    const client = await createLocalClient({
      name: "Анна",
      label: "",
      city: "",
      phone: "+79990000000",
      telegram: "",
      vk: "",
      instagram: "",
      note: "",
      customData: {}
    }, db);

    await expect(db.clients.get(client.id)).resolves.toMatchObject({
      id: client.id,
      name: "Анна",
      phone: "+79990000000",
      label: "",
      archivedAt: null,
      deletedAt: null,
      revision: 0
    });
    const patches = await db.outbox.orderBy("clientTimestamp").toArray();
    expect(patches).toEqual([
      expect.objectContaining({
        entity: "client",
        entityId: client.id,
        operation: "create",
        changedFields: expect.objectContaining({
          name: "Анна",
          phone: "+79990000000"
        }),
        baseRevision: 0,
        syncStatus: "pending",
        clientTimestamp: client.updatedAt
      })
    ]);
  });

  it("updates a local client and stores an update patch in outbox", async () => {
    const db = createTestDb();
    const client = await seedClient(db, { name: "Анна", phone: "+79990000000", revision: 4 });

    const updated = await updateLocalClient(client, {
      name: "Анна К.",
      label: "центр",
      city: "",
      phone: "+79991111111",
      telegram: "",
      vk: "",
      instagram: "",
      note: "",
      customData: {}
    }, db);

    expect(updated.revision).toBe(4);
    await expect(db.clients.get(client.id)).resolves.toMatchObject({
      name: "Анна К.",
      phone: "+79991111111",
      label: "центр",
      revision: 4,
      updatedAt: updated.updatedAt
    });
    const patches = await db.outbox.orderBy("clientTimestamp").toArray();
    expect(patches).toEqual([
      expect.objectContaining({
        entity: "client",
        entityId: client.id,
        operation: "update",
        changedFields: expect.objectContaining({
          name: "Анна К.",
          phone: "+79991111111",
          label: "центр"
        }),
        baseRevision: 4,
        syncStatus: "pending",
        clientTimestamp: updated.updatedAt
      })
    ]);
  });

  it("archives and restores a local client with update patches", async () => {
    const db = createTestDb();
    const client = await seedClient(db, { name: "Анна", revision: 2 });

    const archived = await archiveLocalClient(client, db);
    const restored = await restoreLocalClient(archived, db);

    await expect(db.clients.get(client.id)).resolves.toMatchObject({
      archivedAt: null,
      updatedAt: restored.updatedAt,
      revision: 2
    });
    const patches = await db.outbox.orderBy("createdAt").toArray();
    expect(patches).toEqual([
      expect.objectContaining({
        entity: "client",
        entityId: client.id,
        operation: "update",
        changedFields: { archivedAt: archived.archivedAt },
        baseRevision: 2,
        clientTimestamp: archived.updatedAt
      }),
      expect.objectContaining({
        entity: "client",
        entityId: client.id,
        operation: "update",
        changedFields: { archivedAt: null },
        baseRevision: 2,
        clientTimestamp: restored.updatedAt
      })
    ]);
  });

  it("hides archived clients by default and can include them", async () => {
    const db = createTestDb();
    await seedClient(db, { name: "Активная" });
    await seedClient(db, { name: "Архивная", archivedAt: "2026-05-25T10:00:00.000Z" });
    await seedClient(db, { name: "Удаленная", deletedAt: "2026-05-25T11:00:00.000Z" });

    await expect(listLocalClients({ query: "", includeArchived: false }, db)).resolves.toEqual([
      expect.objectContaining({ name: "Активная" })
    ]);
    await expect(listLocalClients({ query: "", includeArchived: true }, db)).resolves.toEqual([
      expect.objectContaining({ name: "Активная" }),
      expect.objectContaining({ name: "Архивная" })
    ]);
  });

  it("filters local clients by name, label, phone and Telegram", async () => {
    const db = createTestDb();
    await seedClient(db, { name: "Анна", label: "центр" });
    await seedClient(db, { name: "Мария", phone: "+79991111111" });
    await seedClient(db, { name: "Ольга", telegram: "@needle" });
    await seedClient(db, { name: "Света", label: "север" });

    await expect(listLocalClients({ query: "ан", includeArchived: true }, db)).resolves.toEqual([
      expect.objectContaining({ name: "Анна" })
    ]);
    await expect(listLocalClients({ query: "центр", includeArchived: true }, db)).resolves.toEqual([
      expect.objectContaining({ name: "Анна" })
    ]);
    await expect(listLocalClients({ query: "1111", includeArchived: true }, db)).resolves.toEqual([
      expect.objectContaining({ name: "Мария" })
    ]);
    await expect(listLocalClients({ query: "needle", includeArchived: true }, db)).resolves.toEqual([
      expect.objectContaining({ name: "Ольга" })
    ]);
  });
});

function createTestDb(): WorkPlannerLocalDb {
  const name = `work-planner-clients-test-${globalThis.crypto.randomUUID()}`;
  const db = createWorkPlannerLocalDb(name);
  databases.push(db);
  return db;
}

async function seedClient(db: WorkPlannerLocalDb, overrides: Partial<Client>): Promise<Client> {
  const timestamp = "2026-05-25T09:00:00.000Z";
  const client: Client = {
    id: overrides.id ?? globalThis.crypto.randomUUID(),
    userId: overrides.userId ?? "550e8400-e29b-41d4-a716-446655440000",
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

  await db.clients.put(client);
  return client;
}
