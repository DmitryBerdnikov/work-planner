import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("health route", () => {
  it("returns health payload", async () => {
    const response = await app.request("/api/health");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });
});

