import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppointmentWithComputedStatus } from "@work-planner/shared";
import { syncWorkPlanner, type WorkPlannerSyncStatus } from "@modules/sync";
import {
  emptyAppointmentFormValues,
  mapAppointmentToFormValues,
  toDateTimeLocalInputValue
} from "../model/appointments-form";
import type { AppointmentsPageSearch } from "../model/appointments-page-search";
import { defaultAppointmentsListParams } from "../model/appointments-queries";
import { useAppointmentClients } from "./use-appointment-clients";
import { useAppointmentsList } from "./use-appointments-list";
import { useCancelAppointment } from "./use-cancel-appointment";
import { useInvalidateAppointments } from "./use-invalidate-appointments";
import { useSaveAppointment } from "./use-save-appointment";

export const useAppointmentsPage = (search: AppointmentsPageSearch = {}) => {
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithComputedStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<WorkPlannerSyncStatus>("pending");
  const syncRunIdRef = useRef(0);
  const { appointments, appointmentsQuery } = useAppointmentsList(defaultAppointmentsListParams);
  const { clients, clientsQuery } = useAppointmentClients();
  const invalidateAppointments = useInvalidateAppointments();

  const startSync = useCallback(() => {
    const syncRunId = syncRunIdRef.current + 1;
    syncRunIdRef.current = syncRunId;
    setSyncStatus("pending");

    syncWorkPlanner()
      .then(async (result) => {
        if (syncRunIdRef.current === syncRunId) {
          setSyncStatus(result.status);
        }

        await invalidateAppointments();
      })
      .catch(() => {
        if (syncRunIdRef.current === syncRunId) {
          setSyncStatus("failed");
        }
      });
  }, [invalidateAppointments]);

  const { handleCancel, isCancelBusy } = useCancelAppointment({
    onSuccess: startSync
  });

  const saveAppointmentMutation = useSaveAppointment({
    editingAppointment,
    onSuccess: () => {
      setEditingAppointment(null);
      startSync();
    }
  });

  const clientNameById = useMemo(() => {
    return new Map(clients.map((client) => [client.id, client.name]));
  }, [clients]);

  useEffect(() => {
    if (!search.editId || appointments.length === 0) {
      return;
    }

    const appointment = appointments.find((item) => item.id === search.editId);

    if (appointment) {
      setEditingAppointment(appointment);
    }
  }, [appointments, search.editId]);

  useEffect(() => {
    let isMounted = true;
    const syncRunId = syncRunIdRef.current + 1;
    syncRunIdRef.current = syncRunId;
    setSyncStatus("pending");

    syncWorkPlanner()
      .then(async (result) => {
        if (!isMounted || syncRunIdRef.current !== syncRunId) {
          return;
        }

        setSyncStatus(result.status);
        await invalidateAppointments();
      })
      .catch(() => {
        if (isMounted && syncRunIdRef.current === syncRunId) {
          setSyncStatus("failed");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [invalidateAppointments]);

  const initialFormValues = editingAppointment
    ? mapAppointmentToFormValues(editingAppointment)
    : search.startsAt
      ? {
          ...emptyAppointmentFormValues(),
          startsAtLocal: toDateTimeLocalInputValue(search.startsAt)
        }
      : emptyAppointmentFormValues();

  const handleEdit = (appointment: AppointmentWithComputedStatus) => {
    setEditingAppointment(appointment);
  };

  const handleCancelEdit = () => {
    setEditingAppointment(null);
  };

  return {
    appointments,
    appointmentsQuery,
    clients,
    clientsQuery,
    clientNameById,
    syncStatus,
    editingAppointment,
    initialFormValues,
    isSaving: saveAppointmentMutation.isPending,
    saveError: saveAppointmentMutation.error,
    isCancelBusy,
    handleEdit,
    handleCancelEdit,
    handleSave: saveAppointmentMutation.mutate,
    handleCancel
  };
};
