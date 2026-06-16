import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { createWorkPlannerLocalDb, type WorkPlannerLocalDb } from "./local-db";
import { enqueueOutboxPatch, listPendingOutboxPatches, markOutboxPatchesSynced } from "./outbox";
import { getLastSuccessfulSyncAt, setLastSuccessfulSyncAt } from "./sync-meta";

const databases: WorkPlannerLocalDb[] = [];

describe("local sync database", () => {
  afterEach(async () => {
    await Promise.all(databases.splice(0).map(async (db) => {
      db.close();
      await Dexie.delete(db.name);
    }));
  });

  it("creates the Dexie schema for sync foundation tables", () => {
    const db = createTestDb();

    expect(db.tables.map((table) => table.name).sort()).toEqual([
      "appointments",
      "clients",
      "outbox",
      "syncMeta"
    ]);
    expect(Object.keys(db.clients.schema.idxByName)).toEqual(
      expect.arrayContaining(["userId", "updatedAt", "revision", "deletedAt", "archivedAt"])
    );
    expect(Object.keys(db.appointments.schema.idxByName)).toEqual(
      expect.arrayContaining(["userId", "startsAt", "updatedAt", "revision", "deletedAt", "clientId", "status"])
    );
  });

  it("stores pending outbox operations", async () => {
    const db = createTestDb();
    const patch = {
      id: randomId(),
      entity: "client" as const,
      entityId: randomId(),
      operation: "create" as const,
      changedFields: { name: "Анна" },
      baseRevision: 0,
      clientTimestamp: "2026-05-25T10:00:00.000Z"
    };

    await enqueueOutboxPatch(db, patch);

    await expect(listPendingOutboxPatches(db)).resolves.toEqual([
      expect.objectContaining({
        ...patch,
        syncStatus: "pending",
        createdAt: expect.any(String)
      })
    ]);
  });

  it("marks outbox operations as synced", async () => {
    const db = createTestDb();
    const patch = {
      id: randomId(),
      entity: "appointment" as const,
      entityId: randomId(),
      operation: "update" as const,
      changedFields: { status: "cancelled" },
      baseRevision: 1,
      clientTimestamp: "2026-05-25T11:00:00.000Z"
    };

    await enqueueOutboxPatch(db, patch);
    await markOutboxPatchesSynced(db, [patch.id]);

    await expect(db.outbox.get(patch.id)).resolves.toMatchObject({
      syncStatus: "synced",
      syncedAt: expect.any(String)
    });
  });

  it("stores the last successful sync timestamp", async () => {
    const db = createTestDb();

    await setLastSuccessfulSyncAt(db, "2026-05-25T12:00:00.000Z");

    await expect(getLastSuccessfulSyncAt(db)).resolves.toBe("2026-05-25T12:00:00.000Z");
  });

  it("keeps generated sync API imports inside the sync model layer", () => {
    const sources = import.meta.glob("/src/**/*.{ts,tsx}", {
      query: "?raw",
      import: "default",
      eager: true
    }) as Record<string, string>;

    const offenders = Object.entries(sources)
      .filter(([path, source]) => {
        return !path.includes("/modules/sync/model/")
          && source.includes("@shared/api/generated/work-planner-api")
          && /\b(pushSync|pullSync)\b/.test(source);
      })
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });
});

function createTestDb(): WorkPlannerLocalDb {
  const name = `work-planner-test-${randomId()}`;
  const db = createWorkPlannerLocalDb(name);
  databases.push(db);
  return db;
}

function randomId(): string {
  return globalThis.crypto.randomUUID();
}
