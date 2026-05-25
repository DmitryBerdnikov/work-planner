import { useQuery } from "@tanstack/react-query";
import { appointmentsQueries, type AppointmentsListParams } from "../model/appointments-queries";

export const useAppointmentsList = (params: AppointmentsListParams) => {
  const appointmentsQuery = useQuery({
    ...appointmentsQueries.list(params),
    retry: false
  });

  return {
    appointmentsQuery,
    appointments: appointmentsQuery.data?.appointments ?? []
  };
};
