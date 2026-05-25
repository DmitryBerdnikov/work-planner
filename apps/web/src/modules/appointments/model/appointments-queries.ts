import { queryOptions } from "@tanstack/react-query";
import { FetchClientsIncludeArchived, fetchAppointments, fetchClients } from "@shared/api/generated/work-planner-api";

export type AppointmentsListParams = {
  from?: string;
  to?: string;
};

const rootKey = ["appointments"] as const;

export const appointmentsQueries = {
  all: rootKey,
  list: (params: AppointmentsListParams = defaultAppointmentsListParams) =>
    queryOptions({
      queryKey: [...rootKey, "list", params] as const,
      queryFn: () =>
        fetchAppointments({
          from: params.from,
          to: params.to
        }),
      retry: false
    }),
  clientsForSelect: () =>
    queryOptions({
      queryKey: [...rootKey, "clients-for-select"] as const,
      queryFn: () =>
        fetchClients({
          includeArchived: FetchClientsIncludeArchived.false
        }),
      retry: false
    })
};

export const defaultAppointmentsListParams: AppointmentsListParams = {};
