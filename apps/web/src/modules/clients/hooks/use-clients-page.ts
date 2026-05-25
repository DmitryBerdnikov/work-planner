import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Client, CreateClientPayload } from "@work-planner/shared";
import { archiveClient, createClient, fetchClients, restoreClient, updateClient } from "@shared/api/generated/work-planner-api";
import { clientsKeys, emptyClientFormValues, toClientFormValues } from "../model";

export const useClientsPage = () => {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const clientsQuery = useQuery({
    queryKey: clientsKeys.list({ query, includeArchived }),
    queryFn: () => fetchClients({ q: query || undefined, includeArchived: includeArchived ? "true" : undefined }),
    retry: false
  });

  const saveClientMutation = useMutation({
    mutationFn: (payload: CreateClientPayload) => {
      if (editingClient) {
        return updateClient(editingClient.id, payload);
      }

      return createClient(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clientsKeys.all });
      setEditingClient(null);
    },
    retry: false
  });

  const archiveClientMutation = useMutation({
    mutationFn: (client: Client) => archiveClient(client.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clientsKeys.all });
    },
    retry: false
  });

  const restoreClientMutation = useMutation({
    mutationFn: (client: Client) => restoreClient(client.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clientsKeys.all });
    },
    retry: false
  });

  const handleEdit = (client: Client) => {
    setEditingClient(client);
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
  };

  const handleSave = (payload: CreateClientPayload) => {
    saveClientMutation.mutate(payload);
  };

  return {
    clients: clientsQuery.data?.clients ?? [],
    clientsQuery,
    query,
    includeArchived,
    editingClient,
    initialFormValues: editingClient ? toClientFormValues(editingClient) : emptyClientFormValues,
    isSaving: saveClientMutation.isPending,
    saveError: saveClientMutation.error,
    isArchiveBusy: archiveClientMutation.isPending || restoreClientMutation.isPending,
    setQuery,
    setIncludeArchived,
    handleEdit,
    handleCancelEdit,
    handleSave,
    handleArchive: archiveClientMutation.mutate,
    handleRestore: restoreClientMutation.mutate
  };
};
