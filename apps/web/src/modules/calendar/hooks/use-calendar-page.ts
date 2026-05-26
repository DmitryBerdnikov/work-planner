import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DatesSetArg } from "@fullcalendar/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { AppointmentWithComputedStatus } from "@work-planner/shared";
import { appointmentsQueries, useCancelAppointment } from "@modules/appointments";
import { syncWorkPlanner } from "@modules/sync";
import { defaultCalendarVisibleRange, toCalendarVisibleRange, type CalendarVisibleRange } from "../model/calendar-range";

export const useCalendarPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [visibleRange, setVisibleRange] = useState<CalendarVisibleRange>(defaultCalendarVisibleRange);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithComputedStatus | null>(null);
  const syncRunIdRef = useRef(0);

  const appointmentsQuery = useQuery(appointmentsQueries.list(visibleRange));
  const clientsQuery = useQuery(appointmentsQueries.clientsForSelect());
  const startSync = useCallback(() => {
    const syncRunId = syncRunIdRef.current + 1;
    syncRunIdRef.current = syncRunId;

    syncWorkPlanner()
      .then(async () => {
        if (syncRunIdRef.current === syncRunId) {
          await queryClient.invalidateQueries({ queryKey: appointmentsQueries.all });
        }
      })
      .catch(() => undefined);
  }, [queryClient]);
  const { handleCancel, isCancelBusy } = useCancelAppointment({
    onSuccess: () => {
      startSync();
    }
  });

  const appointments = appointmentsQuery.data?.appointments ?? [];

  const clientNameById = useMemo(() => {
    const clients = clientsQuery.data?.clients ?? [];
    return new Map(clients.map((client) => [client.id, client.name]));
  }, [clientsQuery.data?.clients]);

  const handleDatesChange = (arg: DatesSetArg) => {
    setVisibleRange(toCalendarVisibleRange(arg.start, arg.end));
  };

  useEffect(() => {
    let isMounted = true;
    const syncRunId = syncRunIdRef.current + 1;
    syncRunIdRef.current = syncRunId;

    syncWorkPlanner()
      .then(async () => {
        if (isMounted && syncRunIdRef.current === syncRunId) {
          await queryClient.invalidateQueries({ queryKey: appointmentsQueries.all });
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [queryClient]);

  const handleEventClick = (appointment: AppointmentWithComputedStatus) => {
    setSelectedAppointment(appointment);
  };

  const handleNavigateToEdit = (appointment: AppointmentWithComputedStatus) => {
    navigate({ to: "/appointments", search: { editId: appointment.id } });
  };

  const handleNavigateToCreate = (startsAt?: string) => {
    navigate({
      to: "/appointments",
      search: startsAt ? { startsAt } : {}
    });
  };

  const handleCancelSelected = async (appointment: AppointmentWithComputedStatus) => {
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
