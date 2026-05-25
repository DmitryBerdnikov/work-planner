import { useQuery } from "@tanstack/react-query";
import { appointmentsQueries } from "../model/appointments-queries";

export const useAppointmentClients = () => {
  const clientsQuery = useQuery({
    ...appointmentsQueries.clientsForSelect(),
    retry: false
  });

  return {
    clientsQuery,
    clients: clientsQuery.data?.clients ?? []
  };
};
