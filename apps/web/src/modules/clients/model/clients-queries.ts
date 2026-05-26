import { queryOptions } from "@tanstack/react-query";
import { listLocalClients } from "./clients-local";

export type ClientsListParams = {
  query: string;
  includeArchived: boolean;
};

const rootKey = ["clients"] as const;

export const clientsQueries = {
  all: rootKey,
  list: (params: ClientsListParams) =>
    queryOptions({
      queryKey: [...rootKey, "list", params] as const,
      queryFn: async () => ({ clients: await listLocalClients(params) }),
      networkMode: "always",
      retry: false
    })
};

export const defaultClientsListParams: ClientsListParams = {
  query: "",
  includeArchived: false
};
