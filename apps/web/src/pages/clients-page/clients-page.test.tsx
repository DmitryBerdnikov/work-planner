import "fake-indexeddb/auto";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Client } from "@work-planner/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localDb } from "@modules/sync";
import { ClientsPage } from "./index";

const client: Client = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "550e8400-e29b-41d4-a716-446655440001",
  name: "Анна",
  label: "центр",
  city: "Москва",
  phone: "+79990000000",
  telegram: "@anna",
  vk: "",
  instagram: "",
  note: "",
  customData: {},
  archivedAt: null,
  deletedAt: null,
  createdAt: "2026-05-22T10:00:00.000Z",
  updatedAt: "2026-05-22T10:00:00.000Z",
  revision: 0
};

describe("ClientsPage", () => {
  beforeEach(async () => {
    onlineManager.setOnline(true);
    await clearLocalDb();
  });

  afterEach(async () => {
    onlineManager.setOnline(true);
    vi.restoreAllMocks();
    await clearLocalDb();
  });

  it("renders empty state", async () => {
    mockSyncFetch();

    renderClientsPage();

    expect(await screen.findByText("Клиентов пока нет")).toBeInTheDocument();
  });

  it("renders clients and submits create form", async () => {
    await localDb.clients.put(client);
    const fetchMock = mockSyncFetch();

    renderClientsPage();

    expect(await screen.findByText("Анна")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Мария" } });
    fireEvent.change(screen.getByLabelText("Телефон"), { target: { value: "+79991111111" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));

    await waitFor(() => {
      expect(screen.getByText("Мария")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/sync/push"),
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/api/clients"))).toBe(false);
  });

  it("archives and restores clients locally", async () => {
    await localDb.clients.put(client);
    mockSyncFetch();

    renderClientsPage();

    expect(await screen.findByText("Анна")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Архивировать Анна" }));

    await waitFor(() => {
      expect(screen.queryByText("Анна")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Архив"));

    expect(await screen.findByText("Анна")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Вернуть Анна из архива" }));

    await waitFor(() => {
      expect(screen.getByText("Анна")).toBeInTheDocument();
    });
  });

  it("keeps local changes visible when sync fails", async () => {
    mockSyncFetch({ failPush: true });

    renderClientsPage();

    fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Мария" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));

    expect(await screen.findByText("Мария")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Добавить" })).toBeEnabled();
    expect(screen.queryByText("Сохранение...")).not.toBeInTheDocument();
    expect(screen.queryByText("sync_failed")).not.toBeInTheDocument();
    expect(await screen.findByText("Синхронизация не удалась")).toBeInTheDocument();
  });

  it("saves clients while TanStack Query is offline", async () => {
    onlineManager.setOnline(false);
    mockSyncFetch();

    renderClientsPage();

    fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Мария" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));

    expect(await screen.findByText("Мария")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Добавить" })).toBeEnabled();
    expect(screen.queryByText("Сохранение...")).not.toBeInTheDocument();
  });

  it("does not keep create form busy while sync is still running", async () => {
    mockSyncFetch({ hangPush: true });

    renderClientsPage();

    fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Мария" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));

    expect(await screen.findByText("Мария")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Добавить" })).toBeEnabled();
    expect(screen.queryByText("Сохранение...")).not.toBeInTheDocument();
  });

  it("does not keep archive and restore actions busy while sync is still running", async () => {
    await localDb.clients.put(client);
    mockSyncFetch({ hangPush: true });

    renderClientsPage();

    expect(await screen.findByText("Анна")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Архивировать Анна" }));

    await waitFor(() => {
      expect(screen.queryByText("Анна")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Архив"));

    const restoreButton = await screen.findByRole("button", { name: "Вернуть Анна из архива" });
    expect(restoreButton).toBeEnabled();

    fireEvent.click(restoreButton);

    expect(await screen.findByRole("button", { name: "Архивировать Анна" })).toBeEnabled();
  });

  it("does not import generated clients CRUD API in clients modules", () => {
    const sources = import.meta.glob("/src/modules/clients/**/*.{ts,tsx}", {
      query: "?raw",
      import: "default",
      eager: true
    }) as Record<string, string>;
    const generatedCrudNames = /\b(fetchClients|createClient|updateClient|archiveClient|restoreClient)\b/;
    const offenders = Object.entries(sources)
      .filter(([, source]) => source.includes("@shared/api/generated/work-planner-api") && generatedCrudNames.test(source))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });
});

function renderClientsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ClientsPage />
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
  const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const urlString = String(url);

    if (urlString.includes("/api/sync/push")) {
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

    if (urlString.includes("/api/sync/pull")) {
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
