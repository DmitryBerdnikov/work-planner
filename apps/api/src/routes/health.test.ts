import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("health route", () => {
  it("returns health payload", async () => {
    const response = await app.request("/api/health");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });

  it("serves OpenAPI document without a session", async () => {
    const response = await app.request("/api/openapi.json");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      openapi: "3.0.0",
      info: { title: "Work Planner API" }
    });
  });

  it("does not serve API docs outside local development", async () => {
    const response = await app.request("/api/docs");

    expect(response.status).toBe(404);
  });
});
