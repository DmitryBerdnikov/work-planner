import type { Client, CreateClientPayload } from "@work-planner/shared";
import { enqueueOutboxPatch, localDb, type WorkPlannerLocalDb } from "@modules/sync";
import type { ClientsListParams } from "./clients-queries";

const localUserId = "00000000-0000-0000-0000-000000000000";

export async function listLocalClients(
  params: ClientsListParams,
  db: WorkPlannerLocalDb = localDb
): Promise<Client[]> {
  const query = params.query.trim().toLowerCase();
  const clients = await db.clients.toArray();

  return clients
    .filter((client) => client.deletedAt === null)
    .filter((client) => params.includeArchived || client.archivedAt === null)
    .filter((client) => matchesClientQuery(client, query))
    .sort(compareClients);
}

export async function createLocalClient(
  payload: CreateClientPayload,
  db: WorkPlannerLocalDb = localDb
): Promise<Client> {
  const timestamp = new Date().toISOString();
  const client: Client = {
    id: globalThis.crypto.randomUUID(),
    userId: localUserId,
    ...normalizeClientPayload(payload),
    archivedAt: null,
    deletedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    revision: 0
  };

  await db.transaction("rw", db.clients, db.outbox, async () => {
    await db.clients.put(client);
    await enqueueOutboxPatch(db, {
      id: globalThis.crypto.randomUUID(),
      entity: "client",
      entityId: client.id,
      operation: "create",
      changedFields: normalizeClientPayload(payload),
      baseRevision: 0,
      clientTimestamp: timestamp
    });
  });

  return client;
}

export async function updateLocalClient(
  client: Client,
  payload: CreateClientPayload,
  db: WorkPlannerLocalDb = localDb
): Promise<Client> {
  const timestamp = new Date().toISOString();
  const changedFields = normalizeClientPayload(payload);
  const updatedClient: Client = {
    ...client,
    ...changedFields,
    updatedAt: timestamp
  };

  await updateClientWithPatch(db, updatedClient, {
    changedFields,
    baseRevision: client.revision,
    clientTimestamp: timestamp
  });

  return updatedClient;
}

export async function archiveLocalClient(
  client: Client,
  db: WorkPlannerLocalDb = localDb
): Promise<Client> {
  const timestamp = new Date().toISOString();
  const updatedClient: Client = {
    ...client,
    archivedAt: timestamp,
    updatedAt: timestamp
  };

  await updateClientWithPatch(db, updatedClient, {
    changedFields: { archivedAt: timestamp },
    baseRevision: client.revision,
    clientTimestamp: timestamp
  });

  return updatedClient;
}

export async function restoreLocalClient(
  client: Client,
  db: WorkPlannerLocalDb = localDb
): Promise<Client> {
  const timestamp = new Date().toISOString();
  const updatedClient: Client = {
    ...client,
    archivedAt: null,
    updatedAt: timestamp
  };

  await updateClientWithPatch(db, updatedClient, {
    changedFields: { archivedAt: null },
    baseRevision: client.revision,
    clientTimestamp: timestamp
  });

  return updatedClient;
}

function normalizeClientPayload(payload: CreateClientPayload): CreateClientPayload {
  return {
    name: payload.name,
    label: payload.label ?? "",
    city: payload.city ?? "",
    phone: payload.phone ?? "",
    telegram: payload.telegram ?? "",
    vk: payload.vk ?? "",
    instagram: payload.instagram ?? "",
    note: payload.note ?? "",
    customData: payload.customData ?? {}
  };
}

async function updateClientWithPatch(
  db: WorkPlannerLocalDb,
  client: Client,
  patch: {
    changedFields: Record<string, unknown>;
    baseRevision: number;
    clientTimestamp: string;
  }
): Promise<void> {
  await db.transaction("rw", db.clients, db.outbox, async () => {
    await db.clients.put(client);
    await enqueueOutboxPatch(db, {
      id: globalThis.crypto.randomUUID(),
      entity: "client",
      entityId: client.id,
      operation: "update",
      changedFields: patch.changedFields,
      baseRevision: patch.baseRevision,
      clientTimestamp: patch.clientTimestamp
    });
  });
}

function matchesClientQuery(client: Client, query: string): boolean {
  if (!query) {
    return true;
  }

  return [client.name, client.label, client.phone, client.telegram].some((value) => value.toLowerCase().includes(query));
}

function compareClients(first: Client, second: Client): number {
  const byName = first.name.localeCompare(second.name);

  if (byName !== 0) {
    return byName;
  }

  return first.createdAt.localeCompare(second.createdAt);
}
