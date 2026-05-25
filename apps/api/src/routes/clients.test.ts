import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app";
import { sqlite } from "../db/client";

const activeUserId = "550e8400-e29b-41d4-a716-446655440000";
const pendingUserId = "550e8400-e29b-41d4-a716-446655440001";
const blockedUserId = "550e8400-e29b-41d4-a716-446655440003";
const otherUserId = "550e8400-e29b-41d4-a716-446655440002";
const missingClientId = "550e8400-e29b-41d4-a716-446655440099";

describe("clients routes", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("returns 401 without a session", async () => {
    const response = await app.request("/api/clients");

    expect(response.status).toBe(401);
  });

  it("returns 403 for a pending profile", async () => {
    seedProfile(pendingUserId, "pending@example.com", "pending");

    const response = await app.request("/api/clients", {
      headers: testHeaders(pendingUserId)
    });

    expect(response.status).toBe(403);
  });

  it("returns 403 for a blocked profile", async () => {
    seedProfile(blockedUserId, "blocked@example.com", "blocked");

    const response = await app.request("/api/clients", {
      headers: testHeaders(blockedUserId)
    });

    expect(response.status).toBe(403);
  });

  it("returns current user for an active profile", async () => {
    seedProfile(activeUserId, "active@example.com", "active");

    const response = await app.request("/api/me", {
      headers: testHeaders(activeUserId)
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      user: {
        id: activeUserId,
        email: `${activeUserId}@example.com`
      }
    });
  });

  it("returns validation_error when creating a client without a name", async () => {
    seedProfile(activeUserId, "active@example.com", "active");

    const response = await app.request("/api/clients", {
      method: "POST",
      headers: testHeaders(activeUserId),
      body: JSON.stringify({ name: "   " })
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "validation_error" });
  });

  it("returns validation_error when patching with an empty body", async () => {
    seedProfile(activeUserId, "active@example.com", "active");
    seedClient(activeUserId, "Клиент");

    const clientId = getSingleClientId(activeUserId);
    const response = await app.request(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: testHeaders(activeUserId),
      body: JSON.stringify({})
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "validation_error" });
  });

  it("returns 404 when updating a missing client", async () => {
    seedProfile(activeUserId, "active@example.com", "active");

    const response = await app.request(`/api/clients/${missingClientId}`, {
      method: "PATCH",
      headers: testHeaders(activeUserId),
      body: JSON.stringify({ name: "Новое имя" })
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: "client_not_found" });
  });

  it("returns 404 when archiving a missing client", async () => {
    seedProfile(activeUserId, "active@example.com", "active");

    const response = await app.request(`/api/clients/${missingClientId}/archive`, {
      method: "POST",
      headers: testHeaders(activeUserId)
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: "client_not_found" });
  });

  it("creates, lists, updates, archives and restores a client for an active profile", async () => {
    seedProfile(activeUserId, "active@example.com", "active");

    const createResponse = await app.request("/api/clients", {
      method: "POST",
      headers: testHeaders(activeUserId),
      body: JSON.stringify({
        name: "Анна",
        label: "центр",
        city: "Москва",
        phone: "+79990000000"
      })
    });

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json() as { client: { id: string; name: string; revision: number } };
    expect(created.client).toMatchObject({ name: "Анна", revision: 0 });

    const listResponse = await app.request("/api/clients?q=Анна", {
      headers: testHeaders(activeUserId)
    });
    expect(listResponse.status).toBe(200);
    await expect(listResponse.json()).resolves.toMatchObject({
      clients: [expect.objectContaining({ id: created.client.id, name: "Анна" })]
    });

    const updateResponse = await app.request(`/api/clients/${created.client.id}`, {
      method: "PATCH",
      headers: testHeaders(activeUserId),
      body: JSON.stringify({ name: "Анна К.", note: "постоянный клиент" })
    });
    expect(updateResponse.status).toBe(200);
    await expect(updateResponse.json()).resolves.toMatchObject({
      client: expect.objectContaining({ name: "Анна К.", revision: 1 })
    });

    const archiveResponse = await app.request(`/api/clients/${created.client.id}/archive`, {
      method: "POST",
      headers: testHeaders(activeUserId)
    });
    expect(archiveResponse.status).toBe(200);
    const archived = await archiveResponse.json() as { client: { archivedAt: string | null } };
    expect(archived.client.archivedAt).toEqual(expect.any(String));

    const activeListResponse = await app.request("/api/clients", {
      headers: testHeaders(activeUserId)
    });
    await expect(activeListResponse.json()).resolves.toMatchObject({ clients: [] });

    const archivedListResponse = await app.request("/api/clients?includeArchived=true", {
      headers: testHeaders(activeUserId)
    });
    await expect(archivedListResponse.json()).resolves.toMatchObject({
      clients: [expect.objectContaining({ id: created.client.id, name: "Анна К." })]
    });

    const restoreResponse = await app.request(`/api/clients/${created.client.id}/restore`, {
      method: "POST",
      headers: testHeaders(activeUserId)
    });
    expect(restoreResponse.status).toBe(200);
    await expect(restoreResponse.json()).resolves.toMatchObject({
      client: expect.objectContaining({ archivedAt: null })
    });
  });

  it("does not treat % as a wildcard in search", async () => {
    seedProfile(activeUserId, "active@example.com", "active");
    seedClient(activeUserId, "100% скидка");
    seedClient(activeUserId, "Обычный клиент");

    const response = await app.request(`/api/clients?q=${encodeURIComponent("%")}`, {
      headers: testHeaders(activeUserId)
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      clients: [expect.objectContaining({ name: "100% скидка" })]
    });
  });

  it("does not expose clients between users", async () => {
    seedProfile(activeUserId, "active@example.com", "active");
    seedProfile(otherUserId, "other@example.com", "active");
    seedClient(otherUserId, "Чужой клиент");

    const response = await app.request("/api/clients?includeArchived=true", {
      headers: testHeaders(activeUserId)
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ clients: [] });
  });
});

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

    delete from clients;
    delete from profiles;
  `);
}

function seedProfile(userId: string, email: string, status: "pending" | "active" | "blocked") {
  const now = new Date().toISOString();
  sqlite
    .prepare("insert into profiles (user_id, email, status, activated_at, created_at, updated_at) values (?, ?, ?, ?, ?, ?)")
    .run(userId, email, status, status === "active" ? now : null, now, now);
}

function seedClient(userId: string, name: string) {
  const now = new Date().toISOString();
  sqlite
    .prepare(`
      insert into clients (
        id, user_id, name, label, city, phone, telegram, vk, instagram, note,
        custom_data, archived_at, deleted_at, created_at, updated_at, revision
      )
      values (?, ?, ?, '', '', '', '', '', '', '', '{}', null, null, ?, ?, 0)
    `)
    .run(randomUUID(), userId, name, now, now);
}

function getSingleClientId(userId: string): string {
  const row = sqlite
    .prepare("select id from clients where user_id = ? limit 1")
    .get(userId) as { id: string } | undefined;

  if (!row) {
    throw new Error("Expected a seeded client");
  }

  return row.id;
}
