import { useMutation } from "@tanstack/react-query";
import type { Client, CreateClientPayload } from "@work-planner/shared";
import { createLocalClient, updateLocalClient } from "../model/clients-local";
import { useInvalidateClients } from "./use-invalidate-clients";

type UseSaveClientOptions = {
  editingClient: Client | null;
  onSuccess?: () => void;
};

export const useSaveClient = ({ editingClient, onSuccess }: UseSaveClientOptions) => {
  const invalidateClients = useInvalidateClients();

  return useMutation({
    mutationFn: (payload: CreateClientPayload) => {
      if (editingClient) {
        return updateLocalClient(editingClient, payload);
      }

      return createLocalClient(payload);
    },
    networkMode: "always",
    onSuccess: async () => {
      await invalidateClients();
      onSuccess?.();
    },
    retry: false
  });
};
