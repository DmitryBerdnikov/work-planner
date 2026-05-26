import Dexie, { type Table } from "dexie";
import type { Appointment, Client, SyncPatch } from "@work-planner/shared";

export type LocalClient = Client;
export type LocalAppointment = Appointment;

export type LocalOutboxPatch = SyncPatch & {
  syncStatus: "pending" | "synced";
  createdAt: string;
  syncedAt?: string;
};

export type SyncMetaRecord = {
  key: "lastSuccessfulSyncAt";
  value: string;
  updatedAt: string;
};

export class WorkPlannerLocalDb extends Dexie {
  clients!: Table<LocalClient, string>;
  appointments!: Table<LocalAppointment, string>;
  outbox!: Table<LocalOutboxPatch, string>;
  syncMeta!: Table<SyncMetaRecord, string>;

  constructor(name = "work-planner") {
    super(name);

    this.version(1).stores({
      clients: "id, userId, updatedAt, revision, deletedAt, archivedAt",
      appointments: "id, userId, startsAt, updatedAt, revision, deletedAt, clientId, status",
      outbox: "id, entity, entityId, operation, syncStatus, createdAt, clientTimestamp",
      syncMeta: "key"
    });
  }
}

export function createWorkPlannerLocalDb(name?: string): WorkPlannerLocalDb {
  return new WorkPlannerLocalDb(name);
}

export const localDb = createWorkPlannerLocalDb();
