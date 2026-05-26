import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app";
import { sqlite } from "../db/client";

const activeUserId = "550e8400-e29b-41d4-a716-446655440000";
const pendingUserId = "550e8400-e29b-41d4-a716-446655440001";
const otherUserId = "550e8400-e29b-41d4-a716-446655440002";
const blockedUserId = "550e8400-e29b-41d4-a716-446655440003";

describe("sync routes", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("returns 401 without a session", async () => {
    const response = await app.request("/api/sync/pull");

    expect(response.status).toBe(401);
  });

  it("returns 403 for pending and blocked profiles", async () => {
    seedProfile(pendingUserId, "pending@example.com", "pending");
    seedProfile(blockedUserId, "blocked@example.com", "blocked");

    const pendingResponse = await app.request("/api/sync/pull", {
      headers: testHeaders(pendingUserId)
    });
    const blockedResponse = await app.request("/api/sync/pull", {
      headers: testHeaders(blockedUserId)
    });

    expect(pendingResponse.status).toBe(403);
    expect(blockedResponse.status).toBe(403);
  });

  it("pushes client create and update patches", async () => {
    seedProfile(activeUserId, "active@example.com", "active");
    const clientId = randomUUID();

    const createResponse = await push([{
      id: randomUUID(),
      entity: "client",
      entityId: clientId,
      operation: "create",
      changedFields: { name: "Анна", phone: "+79990000000" },
      baseRevision: 0,
      clientTimestamp: now()
    }]);

    expect(createResponse.status).toBe(200);
    await expect(createResponse.json()).resolves.toMatchObject({
      applied: [expect.objectContaining({ entity: "client", entityId: clientId, revision: 0 })]
    });

    const updateResponse = await push([{
      id: randomUUID(),
      entity: "client",
      entityId: clientId,
      operation: "update",
      changedFields: { name: "Анна К.", note: "постоянный клиент" },
      baseRevision: 0,
      clientTimestamp: now()
    }]);

    expect(updateResponse.status).toBe(200);
    await expect(updateResponse.json()).resolves.toMatchObject({
      applied: [expect.objectContaining({ entity: "client", entityId: clientId, revision: 1 })]
    });
    expect(selectClient(clientId)).toMatchObject({
      user_id: activeUserId,
      name: "Анна К.",
      note: "постоянный клиент",
      revision: 1
    });
  });

  it("pushes appointment create, update and cancel patches", async () => {
    seedProfile(activeUserId, "active@example.com", "active");
    const appointmentId = randomUUID();

    const createResponse = await push([{
      id: randomUUID(),
      entity: "appointment",
      entityId: appointmentId,
      operation: "create",
      changedFields: {
        startsAt: futureStartsAt(),
        title: "Эскиз",
        type: "work",
        sessionAmount: 120000,
        prepaymentAmount: 20000
      },
      baseRevision: 0,
      clientTimestamp: now()
    }]);

    expect(createResponse.status).toBe(200);
    await expect(createResponse.json()).resolves.toMatchObject({
      applied: [expect.objectContaining({ entity: "appointment", entityId: appointmentId, revision: 0 })]
    });

    const updateResponse = await push([{
      id: randomUUID(),
      entity: "appointment",
      entityId: appointmentId,
      operation: "update",
      changedFields: { title: "Финальный эскиз", prepaymentAmount: 30000 },
      baseRevision: 0,
      clientTimestamp: now()
    }]);

    expect(updateResponse.status).toBe(200);

    const cancelResponse = await push([{
      id: randomUUID(),
      entity: "appointment",
      entityId: appointmentId,
      operation: "update",
      changedFields: { status: "cancelled" },
      baseRevision: 1,
      clientTimestamp: now()
    }]);

    expect(cancelResponse.status).toBe(200);
    await expect(cancelResponse.json()).resolves.toMatchObject({
      applied: [expect.objectContaining({ entity: "appointment", entityId: appointmentId, revision: 2 })]
    });
    expect(selectAppointment(appointmentId)).toMatchObject({
      user_id: activeUserId,
      title: "Финальный эскиз",
      status: "cancelled",
      prepayment_amount: 30000,
      revision: 2
    });
  });

  it("pulls only changed data for the current user", async () => {
    seedProfile(activeUserId, "active@example.com", "active");
    seedProfile(otherUserId, "other@example.com", "active");
    seedClient(activeUserId, { name: "Своя", updatedAt: "2026-05-25T10:00:00.000Z" });
    seedClient(activeUserId, { name: "Старая", updatedAt: "2026-05-20T10:00:00.000Z" });
    seedClient(otherUserId, { name: "Чужая", updatedAt: "2026-05-25T10:00:00.000Z" });
    seedAppointment(activeUserId, { title: "Свой сеанс", updatedAt: "2026-05-25T11:00:00.000Z" });
    seedAppointment(otherUserId, { title: "Чужой сеанс", updatedAt: "2026-05-25T11:00:00.000Z" });

    const response = await app.request(`/api/sync/pull?since=${encodeURIComponent("2026-05-24T00:00:00.000Z")}`, {
      headers: testHeaders(activeUserId)
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      clients: [expect.objectContaining({ name: "Своя", userId: activeUserId })],
      appointments: [expect.objectContaining({ title: "Свой сеанс", userId: activeUserId })],
      serverTimestamp: expect.any(String)
    });
  });

  it("does not synchronize another user's data", async () => {
    seedProfile(activeUserId, "active@example.com", "active");
    seedProfile(otherUserId, "other@example.com", "active");
    const otherClientId = seedClient(otherUserId, { name: "Чужая" });

    const response = await push([{
      id: randomUUID(),
      entity: "client",
      entityId: otherClientId,
      operation: "update",
      changedFields: { name: "Перезаписано" },
      baseRevision: 0,
      clientTimestamp: now()
    }]);

    expect(response.status).toBe(404);
    expect(selectClient(otherClientId)).toMatchObject({
      user_id: otherUserId,
      name: "Чужая",
      revision: 0
    });
  });
});

function push(patches: unknown[]) {
  return app.request("/api/sync/push", {
    method: "POST",
    headers: testHeaders(activeUserId),
    body: JSON.stringify({ patches })
  });
}

function testHeaders(userId: string) {
  return {
    "content-type": "application/json",
    "x-test-user-id": userId,
    "x-test-user-email": `${userId}@example.com`
  };
}

function resetDatabase() {
  sqlite.exec(`
    create table if not exists profiles (
      user_id text primary key,
      email text not null unique,
      status text not null default 'pending',
      activated_at text,
      created_at text not null,
      updated_at text not null
    );

    create table if not exists clients (
      id text primary key,
      user_id text not null,
      name text not null,
      label text not null default '',
      city text not null default '',
      phone text not null default '',
      telegram text not null default '',
      vk text not null default '',
      instagram text not null default '',
      note text not null default '',
      custom_data text not null default '{}',
      archived_at text,
      deleted_at text,
      created_at text not null,
      updated_at text not null,
      revision integer not null default 0
    );

    create table if not exists appointments (
      id text primary key,
      user_id text not null,
      client_id text,
      starts_at text not null,
      title text not null,
      type text not null,
      status text not null default 'scheduled',
      session_amount integer not null default 0,
      prepayment_amount integer not null default 0,
      note text not null default '',
      custom_data text not null default '{}',
      deleted_at text,
      created_at text not null,
      updated_at text not null,
      revision integer not null default 0
    );

    delete from appointments;
    delete from clients;
    delete from profiles;
  `);
}

function seedProfile(userId: string, email: string, status: "pending" | "active" | "blocked") {
  const timestamp = now();
  sqlite
    .prepare("insert into profiles (user_id, email, status, activated_at, created_at, updated_at) values (?, ?, ?, ?, ?, ?)")
    .run(userId, email, status, status === "active" ? timestamp : null, timestamp, timestamp);
}

type SeedClientOptions = {
  name: string;
  updatedAt?: string;
};

function seedClient(userId: string, options: SeedClientOptions): string {
  const timestamp = now();
  const id = randomUUID();
  sqlite
    .prepare(`
      insert into clients (
        id, user_id, name, label, city, phone, telegram, vk, instagram, note,
        custom_data, archived_at, deleted_at, created_at, updated_at, revision
      )
      values (?, ?, ?, '', '', '', '', '', '', '', '{}', null, null, ?, ?, 0)
    `)
    .run(id, userId, options.name, timestamp, options.updatedAt ?? timestamp);

  return id;
}

type SeedAppointmentOptions = {
  title: string;
  updatedAt?: string;
};

function seedAppointment(userId: string, options: SeedAppointmentOptions): string {
  const timestamp = now();
  const id = randomUUID();
  sqlite
    .prepare(`
      insert into appointments (
        id, user_id, client_id, starts_at, title, type, status, session_amount,
        prepayment_amount, note, custom_data, deleted_at, created_at, updated_at, revision
      )
      values (?, ?, null, ?, ?, 'work', 'scheduled', 10000, 0, '', '{}', null, ?, ?, 0)
    `)
    .run(id, userId, futureStartsAt(), options.title, timestamp, options.updatedAt ?? timestamp);

  return id;
}

function selectClient(id: string) {
  return sqlite.prepare("select * from clients where id = ?").get(id);
}

function selectAppointment(id: string) {
  return sqlite.prepare("select * from appointments where id = ?").get(id);
}

function now(): string {
  return new Date().toISOString();
}

function futureStartsAt(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}
