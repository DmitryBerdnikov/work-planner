import "fake-indexeddb/auto";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Appointment } from "@work-planner/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localDb } from "@modules/sync";
import { CalendarPage } from "./index";

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

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

vi.mock("@fullcalendar/react", () => ({
  default: ({
    events,
    eventClick,
    dateClick
  }: {
    events: Array<{ id: string; title: string; extendedProps: { appointment: typeof appointment } }>;
    eventClick?: (arg: { event: { extendedProps: { appointment: typeof appointment } } }) => void;
    dateClick?: (arg: { date: Date }) => void;
  }) => (
    <div data-testid="calendar-mock">
      {events.map((event) => (
        <button key={event.id} type="button" onClick={() => eventClick?.({ event })}>
          {event.title}
        </button>
      ))}
      <button
        type="button"
        onClick={() => dateClick?.({ date: new Date("2026-05-27T12:00:00.000Z") })}
      >
        Слот
      </button>
    </div>
  )
}));

describe("CalendarPage", () => {
  beforeEach(async () => {
    await clearLocalDb();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    navigateMock.mockReset();
    await clearLocalDb();
  });

  it("renders appointments from Dexie and opens detail panel without CRUD requests", async () => {
    await localDb.appointments.put(appointment);
    const fetchMock = mockSyncFetch();

    renderCalendarPage();

    expect(await screen.findByText("Эскиз")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Эскиз" }));

    expect(await screen.findByRole("button", { name: /Редактировать/i })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/api/appointments"))).toBe(false);
  });

  it("navigates to appointments with startsAt when slot is clicked", async () => {
    mockSyncFetch();

    renderCalendarPage();

    await screen.findByTestId("calendar-mock");

    fireEvent.click(screen.getByRole("button", { name: "Слот" }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({
        to: "/appointments",
        search: { startsAt: "2026-05-27T12:00:00.000Z" }
      });
    });
  });

  it("closes detail panel after local cancel when sync is still running", async () => {
    await localDb.appointments.put(appointment);
    mockSyncFetch({ hangPush: true });

    renderCalendarPage();

    expect(await screen.findByText("Эскиз")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Эскиз" }));
    fireEvent.click(await screen.findByRole("button", { name: "Отменить" }));

    await waitFor(() => {
      expect(screen.getByText("Детали записи")).toBeInTheDocument();
    });
    await expect(localDb.appointments.get(appointment.id)).resolves.toMatchObject({ status: "cancelled" });
  });
});

function renderCalendarPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  render(
    <QueryClientProvider client={queryClient}>
      <CalendarPage />
    </QueryClientProvider>
  );
}

async function clearLocalDb() {
  await localDb.clients.clear();
  await localDb.appointments.clear();
  await localDb.outbox.clear();
  await localDb.syncMeta.clear();
}

function mockSyncFetch(options: { hangPush?: boolean } = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.includes("/api/sync/push")) {
      if (options.hangPush) {
        return new Promise<Response>(() => undefined);
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
