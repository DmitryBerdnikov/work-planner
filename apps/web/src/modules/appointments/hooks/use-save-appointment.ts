import { useMutation } from "@tanstack/react-query";
import type { AppointmentWithComputedStatus } from "@work-planner/shared";
import {
  mapFormToCreatePayload,
  mapFormToUpdatePayload,
  type AppointmentFormPayload
} from "../model/appointments-form";
import { createLocalAppointment, updateLocalAppointment } from "../model/appointments-local";
import { useInvalidateAppointments } from "./use-invalidate-appointments";

type UseSaveAppointmentOptions = {
  editingAppointment: AppointmentWithComputedStatus | null;
  onSuccess?: () => void;
};

export const useSaveAppointment = ({ editingAppointment, onSuccess }: UseSaveAppointmentOptions) => {
  const invalidateAppointments = useInvalidateAppointments();

  return useMutation({
    mutationFn: (payload: AppointmentFormPayload) => {
      if (editingAppointment) {
        return updateLocalAppointment(editingAppointment, mapFormToUpdatePayload(payload));
      }

      return createLocalAppointment(mapFormToCreatePayload(payload));
    },
    networkMode: "always",
    onSuccess: async () => {
      await invalidateAppointments();
      onSuccess?.();
    },
    retry: false
  });
};
