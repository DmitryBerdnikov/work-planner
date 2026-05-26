import { useEffect, useMemo, useState } from "react";
import type { AppointmentsResponseAppointmentsItem } from "@shared/api/generated/work-planner-api";
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
import { useSaveAppointment } from "./use-save-appointment";

export const useAppointmentsPage = (search: AppointmentsPageSearch = {}) => {
  const [editingAppointment, setEditingAppointment] = useState<AppointmentsResponseAppointmentsItem | null>(null);
  const { appointments, appointmentsQuery } = useAppointmentsList(defaultAppointmentsListParams);
  const { clients, clientsQuery } = useAppointmentClients();
  const { handleCancel, isCancelBusy } = useCancelAppointment();

  const saveAppointmentMutation = useSaveAppointment({
    editingAppointment,
    onSuccess: () => setEditingAppointment(null)
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

  const initialFormValues = editingAppointment
    ? mapAppointmentToFormValues(editingAppointment)
    : search.startsAt
      ? {
          ...emptyAppointmentFormValues(),
          startsAtLocal: toDateTimeLocalInputValue(search.startsAt)
        }
      : emptyAppointmentFormValues();

  const handleEdit = (appointment: AppointmentsResponseAppointmentsItem) => {
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
