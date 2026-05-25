import { useMemo, useState } from "react";
import type { AppointmentsResponseAppointmentsItem } from "@shared/api/generated/work-planner-api";
import { emptyAppointmentFormValues, mapAppointmentToFormValues } from "../model/appointments-form";
import { defaultAppointmentsListParams } from "../model/appointments-queries";
import { useAppointmentClients } from "./use-appointment-clients";
import { useAppointmentsList } from "./use-appointments-list";
import { useCancelAppointment } from "./use-cancel-appointment";
import { useSaveAppointment } from "./use-save-appointment";

export const useAppointmentsPage = () => {
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
    initialFormValues: editingAppointment ? mapAppointmentToFormValues(editingAppointment) : emptyAppointmentFormValues(),
    isSaving: saveAppointmentMutation.isPending,
    saveError: saveAppointmentMutation.error,
    isCancelBusy,
    handleEdit,
    handleCancelEdit,
    handleSave: saveAppointmentMutation.mutate,
    handleCancel
  };
};
