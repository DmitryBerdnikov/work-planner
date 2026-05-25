import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientsPage } from "./clients-page";

const client = {
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders empty state", async () => {
    mockFetch([{ clients: [] }]);

    renderClientsPage();

    expect(await screen.findByText("Клиентов пока нет")).toBeInTheDocument();
  });

  it("renders clients and submits create form", async () => {
    const fetchMock = mockFetch([
      { clients: [client] },
      { client: { ...client, id: "550e8400-e29b-41d4-a716-446655440002", name: "Мария" } },
      { clients: [client, { ...client, id: "550e8400-e29b-41d4-a716-446655440002", name: "Мария" }] }
    ]);

    renderClientsPage();

    expect(await screen.findByText("Анна")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Мария" } });
    fireEvent.change(screen.getByLabelText("Телефон"), { target: { value: "+79991111111" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/clients"),
        expect.objectContaining({ method: "POST" })
      );
    });
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

function mockFetch(payloads: unknown[]) {
  const fetchMock = vi.fn(async () => {
    const payload = payloads.shift() ?? { clients: [] };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}
