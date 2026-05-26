import type { Appointment, Client, SyncEntity } from "@work-planner/shared";
import type { SyncPullResponseAppointmentsItem, SyncPullResponseClientsItem } from "@shared/api/generated/work-planner-api";
import { localDb, type LocalOutboxPatch, type WorkPlannerLocalDb } from "./local-db";
import { listPendingOutboxPatches, markOutboxPatchesSynced } from "./outbox";
import { pullSyncChanges, pushSyncPatches } from "./sync-api";
import { getLastSuccessfulSyncAt, setLastSuccessfulSyncAt } from "./sync-meta";

export type WorkPlannerSyncStatus = "synced" | "pending" | "failed";

const supportedEntities = new Set<SyncEntity>(["client", "appointment"]);

type SyncWorkPlannerApi = {
  push: typeof pushSyncPatches;
  pull: typeof pullSyncChanges;
};

type SyncWorkPlannerOptions = {
  db?: WorkPlannerLocalDb;
  api?: SyncWorkPlannerApi;
};

export async function syncWorkPlanner(options: SyncWorkPlannerOptions = {}): Promise<{ status: WorkPlannerSyncStatus }> {
  const db = options.db ?? localDb;
  const api = options.api ?? {
    push: pushSyncPatches,
    pull: pullSyncChanges
  };

  try {
    const pendingPatches = await listPendingSupportedPatches(db);

    if (pendingPatches.length > 0) {
      await api.push({ patches: pendingPatches });
      await markOutboxPatchesSynced(db, pendingPatches.map((patch) => patch.id));
    }

    const since = await getLastSuccessfulSyncAt(db);
    const pullResponse = await api.pull(since ? { since } : undefined);

    await db.transaction("rw", db.clients, db.appointments, db.syncMeta, async () => {
      await db.clients.bulkPut(pullResponse.clients.map(toClient));
      await db.appointments.bulkPut(pullResponse.appointments.map(toAppointment));
      await setLastSuccessfulSyncAt(db, pullResponse.serverTimestamp);
    });

    const remainingPatches = await listPendingSupportedPatches(db);
    return { status: remainingPatches.length > 0 ? "pending" : "synced" };
  } catch {
    return { status: "failed" };
  }
}

function listPendingSupportedPatches(db: WorkPlannerLocalDb): Promise<LocalOutboxPatch[]> {
  return listPendingOutboxPatches(db)
    .then((patches) => patches.filter((patch) => supportedEntities.has(patch.entity)));
}

function toClient(client: SyncPullResponseClientsItem): Client {
  return {
    ...client,
    customData: client.customData ?? {}
  };
}

function toAppointment(appointment: SyncPullResponseAppointmentsItem): Appointment {
  return {
    ...appointment,
    customData: appointment.customData ?? {},
    note: appointment.note ?? ""
  };
}
