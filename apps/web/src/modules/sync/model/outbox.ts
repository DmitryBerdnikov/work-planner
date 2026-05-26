import type { SyncPatch } from "@work-planner/shared";
import type { LocalOutboxPatch, WorkPlannerLocalDb } from "./local-db";

export async function enqueueOutboxPatch(db: WorkPlannerLocalDb, patch: SyncPatch): Promise<LocalOutboxPatch> {
  const outboxPatch: LocalOutboxPatch = {
    ...patch,
    syncStatus: "pending",
    createdAt: new Date().toISOString()
  };

  await db.outbox.put(outboxPatch);
  return outboxPatch;
}

export function listPendingOutboxPatches(db: WorkPlannerLocalDb): Promise<LocalOutboxPatch[]> {
  return db.outbox
    .where("syncStatus")
    .equals("pending")
    .sortBy("createdAt");
}

export async function markOutboxPatchesSynced(db: WorkPlannerLocalDb, patchIds: string[]): Promise<void> {
  const syncedAt = new Date().toISOString();

  await db.transaction("rw", db.outbox, async () => {
    await Promise.all(
      patchIds.map((id) => db.outbox.update(id, {
        syncStatus: "synced",
        syncedAt
      }))
    );
  });
}
