import { useMutation } from "@tanstack/react-query";
import type { Client } from "@work-planner/shared";
import { archiveLocalClient, restoreLocalClient } from "../model/clients-local";
import { useInvalidateClients } from "./use-invalidate-clients";

type UseClientArchiveOptions = {
  onSuccess?: () => void;
};

export const useClientArchive = (options: UseClientArchiveOptions = {}) => {
  const invalidateClients = useInvalidateClients();

  const archiveClientMutation = useMutation({
    mutationFn: (client: Client) => archiveLocalClient(client),
    networkMode: "always",
    onSuccess: async () => {
      await invalidateClients();
      options.onSuccess?.();
    },
    retry: false
  });

  const restoreClientMutation = useMutation({
    mutationFn: (client: Client) => restoreLocalClient(client),
    networkMode: "always",
    onSuccess: async () => {
      await invalidateClients();
      options.onSuccess?.();
    },
    retry: false
  });

  return {
    handleArchive: archiveClientMutation.mutate,
    handleRestore: restoreClientMutation.mutate,
    isArchiveBusy: archiveClientMutation.isPending || restoreClientMutation.isPending
  };
};
