import { randomUUID } from "node:crypto";
import type { AppointmentWithComputedStatus } from "@work-planner/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app";
import { sqlite } from "../db/client";

const activeUserId = "550e8400-e29b-41d4-a716-446655440000";
const pendingUserId = "550e8400-e29b-41d4-a716-446655440001";
const otherUserId = "550e8400-e29b-41d4-a716-446655440002";
const missingAppointmentId = "550e8400-e29b-41d4-a716-446655440099";

describe("appointments routes", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("returns 401 without a session", async () => {
    const response = await app.request("/api/appointments");

    expect(response.status).toBe(401);
  });

  it("returns 403 for a pending profile", async () => {
    seedProfile(pendingUserId, "pending@example.com", "pending");

    const response = await app.request("/api/appointments", {
      headers: testHeaders(pendingUserId)
    });

    expect(response.status).toBe(403);
  });

  it("creates a work appointment without a client", async () => {
    seedProfile(activeUserId, "active@example.com", "active");

    const response = await app.request("/api/appointments", {
      method: "POST",
      headers: testHeaders(activeUserId),
      body: JSON.stringify({
        startsAt: futureStartsAt(),
        title: "Эскиз",
        type: "work",
        sessionAmount: 120000,
        prepaymentAmount: 20000
      })
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      appointment: {
        clientId: null,
        title: "Эскиз",
        type: "work",
        status: "scheduled",
        computedStatus: "scheduled",
        sessionAmount: 120000,
        prepaymentAmount: 20000,
        revision: 0
      }
    });
  });

  it("creates an appointment with a client", async () => {
    seedProfile(activeUserId, "active@example.com", "active");
    const clientId = seedClient(activeUserId, "Анна");

    const response = await app.request("/api/appointments", {
      method: "POST",
      headers: testHeaders(activeUserId),
      body: JSON.stringify({
        clientId,
        startsAt: futureStartsAt(),
        title: "Сеанс",
        type: "work",
        sessionAmount: 90000,
        prepaymentAmount: 0
      })
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      appointment: expect.objectContaining({ clientId, title: "Сеанс" })
    });
  });

  it("returns validation_error when prepayment exceeds session amount", async () => {
    seedProfile(activeUserId, "active@example.com", "active");

    const response = await app.request("/api/appointments", {
      method: "POST",
      headers: testHeaders(activeUserId),
      body: JSON.stringify({
        startsAt: futureStartsAt(),
        title: "Сеанс",
        type: "work",
        sessionAmount: 10000,
        prepaymentAmount: 20000
      })
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "validation_error" });
  });

  it("returns client_not_found when client belongs to another user", async () => {
    seedProfile(activeUserId, "active@example.com", "active");
    seedProfile(otherUserId, "other@example.com", "active");
    const otherClientId = seedClient(otherUserId, "Чужой клиент");

    const response = await app.request("/api/appointments", {
      method: "POST",
      headers: testHeaders(activeUserId),
      body: JSON.stringify({
        clientId: otherClientId,
        startsAt: futureStartsAt(),
        title: "Сеанс",
        type: "work",
        sessionAmount: 10000,
        prepaymentAmount: 0
      })
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: "client_not_found" });
  });

  it("updates an appointment and validates merged amounts", async () => {
    seedProfile(activeUserId, "active@example.com", "active");
    const appointmentId = seedAppointment(activeUserId, {
      startsAt: futureStartsAt(),
      sessionAmount: 10000,
      prepaymentAmount: 0
    });

    const invalidResponse = await app.request(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: testHeaders(activeUserId),
      body: JSON.stringify({ prepaymentAmount: 15000 })
    });
    expect(invalidResponse.status).toBe(400);
    await expect(invalidResponse.json()).resolves.toMatchObject({ error: "validation_error" });

    const response = await app.request(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: testHeaders(activeUserId),
      body: JSON.stringify({ title: "Обновленный сеанс", prepaymentAmount: 5000 })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      appointment: expect.objectContaining({
        title: "Обновленный сеанс",
        prepaymentAmount: 5000,
        revision: 1
      })
    });
  });

  it("returns 404 when updating a missing appointment", async () => {
    seedProfile(activeUserId, "active@example.com", "active");

    const response = await app.request(`/api/appointments/${missingAppointmentId}`, {
      method: "PATCH",
      headers: testHeaders(activeUserId),
      body: JSON.stringify({ title: "Новое название" })
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: "appointment_not_found" });
  });

  it("cancels an appointment", async () => {
    seedProfile(activeUserId, "active@example.com", "active");
    const appointmentId = seedAppointment(activeUserId, { startsAt: futureStartsAt() });

    const response = await app.request(`/api/appointments/${appointmentId}/cancel`, {
      method: "POST",
      headers: testHeaders(activeUserId)
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      appointment: expect.objectContaining({
        status: "cancelled",
        computedStatus: "cancelled",
        revision: 1
      })
    });
  });

  it("computes completed status and salary from listed appointments", async () => {
    seedProfile(activeUserId, "active@example.com", "active");
    seedAppointment(activeUserId, { startsAt: pastStartsAt(), type: "work", sessionAmount: 10000 });
    seedAppointment(activeUserId, { startsAt: pastStartsAt(), type: "personal", sessionAmount: 8000 });
    seedAppointment(activeUserId, { startsAt: pastStartsAt(), type: "work", status: "cancelled", sessionAmount: 7000 });
    seedAppointment(activeUserId, { startsAt: futureStartsAt(), type: "work", sessionAmount: 5000 });

    const response = await app.request("/api/appointments", {
      headers: testHeaders(activeUserId)
    });

    expect(response.status).toBe(200);
    const body = await response.json() as { appointments: AppointmentWithComputedStatus[] };
    expect(body.appointments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "work", status: "scheduled", computedStatus: "completed", sessionAmount: 10000 }),
        expect.objectContaining({ type: "work", status: "cancelled", computedStatus: "cancelled", sessionAmount: 7000 })
      ])
    );
    expect(sumCompletedWorkSalary(body.appointments)).toBe(10000);
  });

  it("does not expose appointments between users", async () => {
    seedProfile(activeUserId, "active@example.com", "active");
    seedProfile(otherUserId, "other@example.com", "active");
    seedAppointment(otherUserId, { title: "Чужой сеанс" });

    const response = await app.request("/api/appointments", {
      headers: testHeaders(activeUserId)
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ appointments: [] });
  });

  it("returns 404 when cancelling another user's appointment", async () => {
    seedProfile(activeUserId, "active@example.com", "active");
    seedProfile(otherUserId, "other@example.com", "active");
    const appointmentId = seedAppointment(otherUserId, { title: "Чужой сеанс" });

    const response = await app.request(`/api/appointments/${appointmentId}/cancel`, {
      method: "POST",
      headers: testHeaders(activeUserId)
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: "appointment_not_found" });
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
  const now = new Date().toISOString();
  sqlite
    .prepare("insert into profiles (user_id, email, status, activated_at, created_at, updated_at) values (?, ?, ?, ?, ?, ?)")
    .run(userId, email, status, status === "active" ? now : null, now, now);
}

function seedClient(userId: string, name: string): string {
  const now = new Date().toISOString();
  const id = randomUUID();
  sqlite
    .prepare(`
      insert into clients (
        id, user_id, name, label, city, phone, telegram, vk, instagram, note,
        custom_data, archived_at, deleted_at, created_at, updated_at, revision
      )
      values (?, ?, ?, '', '', '', '', '', '', '', '{}', null, null, ?, ?, 0)
    `)
    .run(id, userId, name, now, now);

  return id;
}

type SeedAppointmentOverrides = {
  title?: string;
  clientId?: string | null;
  startsAt?: string;
  type?: "work" | "personal";
  status?: "scheduled" | "cancelled";
  sessionAmount?: number;
  prepaymentAmount?: number;
};

function seedAppointment(userId: string, overrides: SeedAppointmentOverrides = {}): string {
  const now = new Date().toISOString();
  const id = randomUUID();
  sqlite
    .prepare(`
      insert into appointments (
        id, user_id, client_id, starts_at, title, type, status, session_amount,
        prepayment_amount, note, custom_data, deleted_at, created_at, updated_at, revision
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, '', '{}', null, ?, ?, 0)
    `)
    .run(
      id,
      userId,
      overrides.clientId ?? null,
      overrides.startsAt ?? futureStartsAt(),
      overrides.title ?? "Сеанс",
      overrides.type ?? "work",
      overrides.status ?? "scheduled",
      overrides.sessionAmount ?? 10000,
      overrides.prepaymentAmount ?? 0,
      now,
      now
    );

  return id;
}

function pastStartsAt(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

function futureStartsAt(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

function sumCompletedWorkSalary(appointments: AppointmentWithComputedStatus[]): number {
  return appointments.reduce((total, appointment) => {
    if (appointment.type === "work" && appointment.computedStatus === "completed") {
      return total + appointment.sessionAmount;
    }

    return total;
  }, 0);
}
