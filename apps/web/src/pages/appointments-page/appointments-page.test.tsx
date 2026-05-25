import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppointmentsPage } from "./index";

const appointment = {
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
  revision: 0,
  computedStatus: "scheduled"
};

const client = {
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders empty state", async () => {
    mockFetch([]);

    renderAppointmentsPage();

    expect(await screen.findByText("Записей пока нет")).toBeInTheDocument();
  });

  it("renders appointments and submits create form", async () => {
    const fetchMock = mockFetch([appointment]);

    renderAppointmentsPage();

    expect(await screen.findByText("Эскиз")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Название"), { target: { value: "Новый сеанс" } });
    fireEvent.change(screen.getByLabelText("Дата и время"), { target: { value: "2026-05-27T12:30" } });
    fireEvent.change(screen.getByLabelText("Стоимость, ₽"), { target: { value: "1500" } });
    fireEvent.change(screen.getByLabelText("Предоплата, ₽"), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/appointments"),
        expect.objectContaining({ method: "POST" })
      );
    });

    const createCall = fetchMock.mock.calls.find(([, init]) => {
      return (init as RequestInit | undefined)?.method === "POST";
    });
    expect(JSON.parse(createCall?.[1]?.body as string)).toMatchObject({
      title: "Новый сеанс",
      clientId: null,
      type: "work",
      sessionAmount: 150000,
      prepaymentAmount: 50000
    });
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

function mockFetch(initialAppointments: unknown[]) {
  let appointments = initialAppointments;

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.includes("/api/clients")) {
      return jsonResponse({ clients: [client] });
    }

    if (url.includes("/api/appointments") && init?.method === "POST") {
      appointments = [
        ...appointments,
        {
          ...appointment,
          id: "550e8400-e29b-41d4-a716-446655440012",
          title: "Новый сеанс"
        }
      ];

      return jsonResponse({ appointment: appointments.at(-1) });
    }

    return jsonResponse({ appointments });
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
