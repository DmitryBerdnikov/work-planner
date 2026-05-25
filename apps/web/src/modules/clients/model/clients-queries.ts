import { queryOptions } from "@tanstack/react-query";
import {
  fetchClients,
  FetchClientsIncludeArchived
} from "@shared/api/generated/work-planner-api";

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
      queryFn: () =>
        fetchClients({
          q: params.query || undefined,
          includeArchived: params.includeArchived ? FetchClientsIncludeArchived.true : undefined
        }),
      retry: false
    })
};

export const defaultClientsListParams: ClientsListParams = {
  query: "",
  includeArchived: false
};
