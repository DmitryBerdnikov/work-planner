import { useMemo, useState } from "react";
import type { DatesSetArg } from "@fullcalendar/core";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { AppointmentsResponseAppointmentsItem } from "@shared/api/generated/work-planner-api";
import { appointmentsQueries, useCancelAppointment } from "@modules/appointments";
import { defaultCalendarVisibleRange, toCalendarVisibleRange, type CalendarVisibleRange } from "../model/calendar-range";

export const useCalendarPage = () => {
  const navigate = useNavigate();
  const [visibleRange, setVisibleRange] = useState<CalendarVisibleRange>(defaultCalendarVisibleRange);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentsResponseAppointmentsItem | null>(null);

  const appointmentsQuery = useQuery(appointmentsQueries.list(visibleRange));
  const clientsQuery = useQuery(appointmentsQueries.clientsForSelect());
  const { handleCancel, isCancelBusy } = useCancelAppointment();

  const appointments = appointmentsQuery.data?.appointments ?? [];

  const clientNameById = useMemo(() => {
    const clients = clientsQuery.data?.clients ?? [];
    return new Map(clients.map((client) => [client.id, client.name]));
  }, [clientsQuery.data?.clients]);

  const handleDatesChange = (arg: DatesSetArg) => {
    setVisibleRange(toCalendarVisibleRange(arg.start, arg.end));
  };

  const handleEventClick = (appointment: AppointmentsResponseAppointmentsItem) => {
    setSelectedAppointment(appointment);
  };

  const handleNavigateToEdit = (appointment: AppointmentsResponseAppointmentsItem) => {
    navigate({ to: "/appointments", search: { editId: appointment.id } });
  };

  const handleNavigateToCreate = (startsAt?: string) => {
    navigate({
      to: "/appointments",
      search: startsAt ? { startsAt } : {}
    });
  };

  const handleCancelSelected = async (appointment: AppointmentsResponseAppointmentsItem) => {
    await handleCancel(appointment);
    setSelectedAppointment((current) => (current?.id === appointment.id ? null : current));
  };

  return {
    appointments,
    appointmentsQuery,
    clientsQuery,
    selectedAppointment,
    selectedClientName: selectedAppointment?.clientId
      ? clientNameById.get(selectedAppointment.clientId)
      : undefined,
    isCancelBusy,
    handleDatesChange,
    handleEventClick,
    handleNavigateToEdit,
    handleNavigateToCreate,
    handleCancelSelected
  };
};
