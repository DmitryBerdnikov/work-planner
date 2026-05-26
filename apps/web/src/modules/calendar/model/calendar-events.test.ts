import { describe, expect, it } from "vitest";
import { mapAppointmentToCalendarEvent } from "./calendar-events";

const appointment = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  userId: "550e8400-e29b-41d4-a716-446655440000",
  clientId: null,
  startsAt: "2026-05-26T10:00:00.000Z",
  title: "Эскиз",
  type: "work" as const,
  status: "scheduled" as const,
  sessionAmount: 120000,
  prepaymentAmount: 20000,
  note: "",
  customData: {},
  deletedAt: null,
  createdAt: "2026-05-25T10:00:00.000Z",
  updatedAt: "2026-05-25T10:00:00.000Z",
  revision: 0,
  computedStatus: "scheduled" as const
};

describe("mapAppointmentToCalendarEvent", () => {
  it("maps appointment to fullcalendar event with type and status classes", () => {
    const event = mapAppointmentToCalendarEvent(appointment);

    expect(event.id).toBe(appointment.id);
    expect(event.title).toBe("Эскиз");
    expect(event.start).toEqual(new Date("2026-05-26T10:00:00.000Z"));
    expect(event.end).toEqual(new Date("2026-05-26T11:00:00.000Z"));
    expect(event.classNames).toEqual(
      expect.arrayContaining([
        "fc-wp-event",
        "fc-wp-event--type-work",
        "fc-wp-event--status-scheduled"
      ])
    );
    expect(event.extendedProps?.appointment).toEqual(appointment);
  });
});
