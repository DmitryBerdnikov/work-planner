import { useMutation } from "@tanstack/react-query";
import type { AppointmentWithComputedStatus } from "@work-planner/shared";
import { cancelLocalAppointment } from "../model/appointments-local";
import { useInvalidateAppointments } from "./use-invalidate-appointments";

type UseCancelAppointmentOptions = {
  onSuccess?: () => void;
};

export const useCancelAppointment = (options: UseCancelAppointmentOptions = {}) => {
  const invalidateAppointments = useInvalidateAppointments();

  const cancelAppointmentMutation = useMutation({
    mutationFn: (appointment: AppointmentWithComputedStatus) => cancelLocalAppointment(appointment),
    networkMode: "always",
    onSuccess: async () => {
      await invalidateAppointments();
      options.onSuccess?.();
    },
    retry: false
  });

  return {
    handleCancel: cancelAppointmentMutation.mutateAsync,
    isCancelBusy: cancelAppointmentMutation.isPending
  };
};
