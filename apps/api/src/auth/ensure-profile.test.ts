import { beforeEach, describe, expect, it } from "vitest";
import { sqlite } from "../db/client.js";
import { ensureProfileForUser } from "./ensure-profile.js";

const userId = "550e8400-e29b-41d4-a716-446655440010";

describe("ensureProfileForUser", () => {
  beforeEach(() => {
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
  });

  it("creates a pending profile", async () => {
    const profile = await ensureProfileForUser(userId, "new@example.com");

    expect(profile).toMatchObject({
      userId,
      email: "new@example.com",
      status: "pending",
      activatedAt: null
    });
  });

  it("is idempotent when profile already exists", async () => {
    const first = await ensureProfileForUser(userId, "new@example.com");
    const second = await ensureProfileForUser(userId, "other@example.com");

    expect(second.userId).toBe(first.userId);
    expect(second.email).toBe("new@example.com");
    expect(second.status).toBe("pending");
  });
});
