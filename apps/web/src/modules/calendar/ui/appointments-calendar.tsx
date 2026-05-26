import { useMemo } from "react";
import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";
import ruLocale from "@fullcalendar/core/locales/ru";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { AppointmentsResponseAppointmentsItem } from "@shared/api/generated/work-planner-api";
import { mapAppointmentsToCalendarEvents } from "../model/calendar-events";
import "./calendar.css";

type AppointmentsCalendarProps = {
  appointments: AppointmentsResponseAppointmentsItem[];
  onDatesChange: (range: DatesSetArg) => void;
  onEventClick: (appointment: AppointmentsResponseAppointmentsItem) => void;
  onDateClick: (startsAt: string) => void;
};

export const AppointmentsCalendar = ({
  appointments,
  onDatesChange,
  onEventClick,
  onDateClick
}: AppointmentsCalendarProps) => {
  const events = useMemo(() => mapAppointmentsToCalendarEvents(appointments), [appointments]);

  return (
    <div className="fc-wp-calendar overflow-hidden rounded-card border border-border bg-surface p-3 sm:p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay"
        }}
        locale={ruLocale}
        height="auto"
        contentHeight={560}
        allDaySlot={false}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        nowIndicator
        events={events}
        datesSet={onDatesChange}
        eventClick={(arg: EventClickArg) => {
          const appointment = arg.event.extendedProps.appointment as AppointmentsResponseAppointmentsItem | undefined;

          if (appointment) {
            onEventClick(appointment);
          }
        }}
        dateClick={(arg) => {
          onDateClick(arg.date.toISOString());
        }}
      />
    </div>
  );
};
