import { useMutation } from "@tanstack/react-query";
import type { AppointmentsResponseAppointmentsItem } from "@shared/api/generated/work-planner-api";
import { createAppointment, updateAppointment } from "@shared/api/generated/work-planner-api";
import {
  mapFormToCreatePayload,
  mapFormToUpdatePayload,
  type AppointmentFormPayload
} from "../model/appointments-form";
import { useInvalidateAppointments } from "./use-invalidate-appointments";

type UseSaveAppointmentOptions = {
  editingAppointment: AppointmentsResponseAppointmentsItem | null;
  onSuccess?: () => void;
};

export const useSaveAppointment = ({ editingAppointment, onSuccess }: UseSaveAppointmentOptions) => {
  const invalidateAppointments = useInvalidateAppointments();

  return useMutation({
    mutationFn: (payload: AppointmentFormPayload) => {
      if (editingAppointment) {
        return updateAppointment(editingAppointment.id, mapFormToUpdatePayload(payload));
      }

      return createAppointment(mapFormToCreatePayload(payload));
    },
    onSuccess: async () => {
      await invalidateAppointments();
      onSuccess?.();
    },
    retry: false
  });
};
