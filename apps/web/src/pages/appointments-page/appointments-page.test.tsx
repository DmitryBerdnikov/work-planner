import "fake-indexeddb/auto";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Appointment, Client } from "@work-planner/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localDb } from "@modules/sync";
import { AppointmentsPage } from "./index";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");

  return {
    ...actual,
    getRouteApi: () => ({
      useSearch: () => ({})
    })
  };
});

const appointment: Appointment = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  userId: "550e8400-e29b-41d4-a716-446655440000",
  clientId: null,
  startsAt: "2026-05-26T10:00:00.000Z",
  title: "Эскиз",
  type: "work",
  status: "scheduled",
  sessionAmount: 120000,
  prepaymentAmount: 20000,
  note: "",
  customData: {},
  deletedAt: null,
  createdAt: "2026-05-25T10:00:00.000Z",
  updatedAt: "2026-05-25T10:00:00.000Z",
  revision: 0
};

const client: Client = {
  id: "550e8400-e29b-41d4-a716-446655440011",
  userId: "550e8400-e29b-41d4-a716-446655440000",
  name: "Анна",
  label: "центр",
  city: "",
  phone: "",
  telegram: "",
  vk: "",
  instagram: "",
  note: "",
  customData: {},
  archivedAt: null,
  deletedAt: null,
  createdAt: "2026-05-25T10:00:00.000Z",
  updatedAt: "2026-05-25T10:00:00.000Z",
  revision: 0
};

describe("AppointmentsPage", () => {
  beforeEach(async () => {
    await clearLocalDb();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await clearLocalDb();
  });

  it("renders empty state", async () => {
    mockSyncFetch();

    renderAppointmentsPage();

    expect(await screen.findByText("Записей пока нет")).toBeInTheDocument();
  });

  it("renders local appointments and submits create form without CRUD requests", async () => {
    await localDb.appointments.put(appointment);
    await localDb.clients.put(client);
    const fetchMock = mockSyncFetch();

    renderAppointmentsPage();

    expect(await screen.findByText("Эскиз")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Название"), { target: { value: "Новый сеанс" } });
    fireEvent.change(screen.getByLabelText("Дата и время"), { target: { value: "2026-05-27T12:30" } });
    fireEvent.change(screen.getByLabelText("Стоимость, ₽"), { target: { value: "1500" } });
    fireEvent.change(screen.getByLabelText("Предоплата, ₽"), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));

    await waitFor(() => {
      expect(screen.getByText("Новый сеанс")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/sync/push"),
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/api/appointments"))).toBe(false);
    const patches = await localDb.outbox.where("entity").equals("appointment").toArray();
    expect(patches.at(-1)).toMatchObject({
      operation: "create",
      changedFields: expect.objectContaining({
        title: "Новый сеанс",
        clientId: null,
        type: "work",
        sessionAmount: 150000,
        prepaymentAmount: 50000
      })
    });
  });

  it("keeps local create visible when sync fails", async () => {
    mockSyncFetch({ failPush: true });

    renderAppointmentsPage();

    fireEvent.change(screen.getByLabelText("Название"), { target: { value: "Новый сеанс" } });
    fireEvent.change(screen.getByLabelText("Дата и время"), { target: { value: "2026-05-27T12:30" } });
    fireEvent.change(screen.getByLabelText("Стоимость, ₽"), { target: { value: "1500" } });
    fireEvent.change(screen.getByLabelText("Предоплата, ₽"), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));

    expect(await screen.findByText("Новый сеанс")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Добавить" })).toBeEnabled();
    expect(screen.queryByText("Сохранение...")).not.toBeInTheDocument();
    expect(screen.queryByText("sync_failed")).not.toBeInTheDocument();
    expect(await screen.findByText("Синхронизация не удалась")).toBeInTheDocument();
  });

  it("does not keep cancel busy while sync is still running", async () => {
    await localDb.appointments.put(appointment);
    mockSyncFetch({ hangPush: true });

    renderAppointmentsPage();

    expect(await screen.findByText("Эскиз")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "Отменить Эскиз" });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText("Отменена")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Отменить Эскиз" })).not.toBeInTheDocument();
  });

  it("does not import generated appointments CRUD API in appointments modules", () => {
    const sources = import.meta.glob("/src/modules/appointments/**/*.{ts,tsx}", {
      query: "?raw",
      import: "default",
      eager: true
    }) as Record<string, string>;
    const generatedCrudNames = /\b(fetchAppointments|createAppointment|updateAppointment|cancelAppointment)\b/;
    const offenders = Object.entries(sources)
      .filter(([, source]) => source.includes("@shared/api/generated/work-planner-api") && generatedCrudNames.test(source))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });
});

function renderAppointmentsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AppointmentsPage />
    </QueryClientProvider>
  );
}

async function clearLocalDb() {
  await localDb.clients.clear();
  await localDb.appointments.clear();
  await localDb.outbox.clear();
  await localDb.syncMeta.clear();
}

function mockSyncFetch(options: { failPush?: boolean; hangPush?: boolean } = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.includes("/api/sync/push")) {
      if (options.hangPush) {
        return new Promise<Response>(() => undefined);
      }

      if (options.failPush) {
        return new Response(JSON.stringify({ error: "sync_failed" }), {
          status: 500,
          headers: { "content-type": "application/json" }
        });
      }

      return jsonResponse({ applied: [] });
    }

    if (url.includes("/api/sync/pull")) {
      return jsonResponse({
        clients: [],
        appointments: [],
        serverTimestamp: "2026-05-25T12:00:00.000Z"
      });
    }

    return new Response(JSON.stringify({ error: "unexpected_request", method: init?.method }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
