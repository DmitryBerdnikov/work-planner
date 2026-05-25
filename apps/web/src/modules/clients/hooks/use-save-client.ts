import { useMutation } from "@tanstack/react-query";
import type { Client, CreateClientPayload } from "@work-planner/shared";
import { createClient, updateClient } from "@shared/api/generated/work-planner-api";
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
        return updateClient(editingClient.id, payload);
      }

      return createClient(payload);
    },
    onSuccess: async () => {
      await invalidateClients();
      onSuccess?.();
    },
    retry: false
  });
};
