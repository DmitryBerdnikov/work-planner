import { useMutation } from "@tanstack/react-query";
import type { Client } from "@work-planner/shared";
import { archiveClient, restoreClient } from "@shared/api/generated/work-planner-api";
import { useInvalidateClients } from "./use-invalidate-clients";

export const useClientArchive = () => {
  const invalidateClients = useInvalidateClients();

  const archiveClientMutation = useMutation({
    mutationFn: (client: Client) => archiveClient(client.id),
    onSuccess: invalidateClients,
    retry: false
  });

  const restoreClientMutation = useMutation({
    mutationFn: (client: Client) => restoreClient(client.id),
    onSuccess: invalidateClients,
    retry: false
  });

  return {
    handleArchive: archiveClientMutation.mutate,
    handleRestore: restoreClientMutation.mutate,
    isArchiveBusy: archiveClientMutation.isPending || restoreClientMutation.isPending
  };
};
