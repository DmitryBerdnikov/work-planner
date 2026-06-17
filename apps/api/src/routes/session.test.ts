import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { sqlite } from "../db/client.js";

const activeUserId = "550e8400-e29b-41d4-a716-446655440000";
const pendingUserId = "550e8400-e29b-41d4-a716-446655440001";

describe("session route", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("returns 401 without a session", async () => {
    const response = await app.request("/api/session");

    expect(response.status).toBe(401);
  });

  it("returns pending profile for a pending user", async () => {
    seedProfile(pendingUserId, "pending@example.com", "pending");

    const response = await app.request("/api/session", {
      headers: testHeaders(pendingUserId)
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      user: {
        id: pendingUserId,
        email: `${pendingUserId}@example.com`
      },
      profile: {
        status: "pending",
        activatedAt: null
      }
    });
  });

  it("returns active profile for an active user", async () => {
    const activatedAt = "2026-05-22T10:00:00.000Z";
    seedProfile(activeUserId, "active@example.com", "active", activatedAt);

    const response = await app.request("/api/session", {
      headers: testHeaders(activeUserId)
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      user: {
        id: activeUserId,
        email: `${activeUserId}@example.com`
      },
      profile: {
        status: "active",
        activatedAt
      }
    });
  });

  it("creates a pending profile for a user without one", async () => {
    const response = await app.request("/api/session", {
      headers: testHeaders(activeUserId)
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      profile: {
        status: "pending",
        activatedAt: null
      }
    });

    const row = sqlite
      .prepare("select status from profiles where user_id = ?")
      .get(activeUserId) as { status: string };

    expect(row.status).toBe("pending");
  });
});

function testHeaders(userId: string) {
  return {
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

    delete from profiles;
  `);
}

function seedProfile(
  userId: string,
  email: string,
  status: "pending" | "active" | "blocked",
  activatedAt: string | null = status === "active" ? new Date().toISOString() : null
) {
  const now = new Date().toISOString();
  sqlite
    .prepare("insert into profiles (user_id, email, status, activated_at, created_at, updated_at) values (?, ?, ?, ?, ?, ?)")
    .run(userId, email, status, activatedAt, now, now);
}
