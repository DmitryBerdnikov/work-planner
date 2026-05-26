import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CalendarPage } from "./index";

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
  afterEach(() => {
    vi.restoreAllMocks();
    navigateMock.mockReset();
  });

  it("renders appointments from API and opens detail panel", async () => {
    mockFetch([appointment]);

    renderCalendarPage();

    expect(await screen.findByText("Эскиз")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Эскиз" }));

    expect(await screen.findByRole("button", { name: /Редактировать/i })).toBeInTheDocument();
  });

  it("navigates to appointments with startsAt when slot is clicked", async () => {
    mockFetch([]);

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

function mockFetch(appointmentsList: unknown[]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes("/api/clients")) {
      return jsonResponse({ clients: [] });
    }

    if (url.includes("/api/appointments")) {
      return jsonResponse({ appointments: appointmentsList });
    }

    return jsonResponse({ appointments: appointmentsList });
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
