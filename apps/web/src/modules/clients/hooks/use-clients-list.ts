import { useQuery } from "@tanstack/react-query";
import { clientsQueries, type ClientsListParams } from "../model/clients-queries";

export const useClientsList = (params: ClientsListParams) => {
  const clientsQuery = useQuery({
    ...clientsQueries.list(params),
    retry: false
  });

  return {
    clientsQuery,
    clients: clientsQuery.data?.clients ?? []
  };
};
