import type { WorkPlannerLocalDb } from "./local-db";

const lastSuccessfulSyncAtKey = "lastSuccessfulSyncAt";

export async function setLastSuccessfulSyncAt(db: WorkPlannerLocalDb, value: string): Promise<void> {
  await db.syncMeta.put({
    key: lastSuccessfulSyncAtKey,
    value,
    updatedAt: new Date().toISOString()
  });
}

export async function getLastSuccessfulSyncAt(db: WorkPlannerLocalDb): Promise<string | undefined> {
  const record = await db.syncMeta.get(lastSuccessfulSyncAtKey);
  return record?.value;
}
