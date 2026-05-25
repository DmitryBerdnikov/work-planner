import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { appointmentsQueries } from "../model/appointments-queries";

export const useInvalidateAppointments = () => {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: appointmentsQueries.all });
  }, [queryClient]);
};
