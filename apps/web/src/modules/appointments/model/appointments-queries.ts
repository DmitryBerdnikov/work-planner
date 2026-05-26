import { queryOptions } from "@tanstack/react-query";
import { listLocalClients } from "@modules/clients";
import { listLocalAppointments } from "./appointments-local";

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
      queryFn: async () => ({ appointments: await listLocalAppointments(params) }),
      networkMode: "always",
      retry: false
    }),
  clientsForSelect: () =>
    queryOptions({
      queryKey: [...rootKey, "clients-for-select"] as const,
      queryFn: async () => ({ clients: await listLocalClients({ query: "", includeArchived: false }) }),
      networkMode: "always",
      retry: false
    })
};

export const defaultAppointmentsListParams: AppointmentsListParams = {};
