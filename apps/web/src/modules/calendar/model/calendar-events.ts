import type { EventInput } from "@fullcalendar/core";
import type { AppointmentsResponseAppointmentsItem } from "@shared/api/generated/work-planner-api";

export const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000;

export const mapAppointmentsToCalendarEvents = (
  appointments: AppointmentsResponseAppointmentsItem[]
): EventInput[] => {
  return appointments.map(mapAppointmentToCalendarEvent);
};

export const mapAppointmentToCalendarEvent = (
  appointment: AppointmentsResponseAppointmentsItem
): EventInput => {
  const start = new Date(appointment.startsAt);
  const end = new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS);

  return {
    id: appointment.id,
    title: appointment.title,
    start,
    end,
    extendedProps: { appointment },
    classNames: [
      "fc-wp-event",
      `fc-wp-event--type-${appointment.type}`,
      `fc-wp-event--status-${appointment.computedStatus}`
    ]
  };
};
