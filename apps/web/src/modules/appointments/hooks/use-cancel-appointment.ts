import { useMutation } from "@tanstack/react-query";
import type { AppointmentsResponseAppointmentsItem } from "@shared/api/generated/work-planner-api";
import { cancelAppointment } from "@shared/api/generated/work-planner-api";
import { useInvalidateAppointments } from "./use-invalidate-appointments";

export const useCancelAppointment = () => {
  const invalidateAppointments = useInvalidateAppointments();

  const cancelAppointmentMutation = useMutation({
    mutationFn: (appointment: AppointmentsResponseAppointmentsItem) => cancelAppointment(appointment.id),
    onSuccess: invalidateAppointments,
    retry: false
  });

  return {
    handleCancel: cancelAppointmentMutation.mutate,
    isCancelBusy: cancelAppointmentMutation.isPending
  };
};
