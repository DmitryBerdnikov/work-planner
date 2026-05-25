import { useState } from "react";
import type { Client, CreateClientPayload } from "@work-planner/shared";
import { defaultClientsListParams } from "../model/clients-queries";
import { emptyClientFormValues, mapClientToFormValues } from "../model/clients-form";
import { useClientArchive } from "./use-client-archive";
import { useClientsList } from "./use-clients-list";
import { useSaveClient } from "./use-save-client";

export const useClientsPage = () => {
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [query, setQuery] = useState(defaultClientsListParams.query);
  const [includeArchived, setIncludeArchived] = useState(defaultClientsListParams.includeArchived);

  const { clients, clientsQuery } = useClientsList({ query, includeArchived });

  const saveClientMutation = useSaveClient({
    editingClient,
    onSuccess: () => setEditingClient(null)
  });

  const { handleArchive, handleRestore, isArchiveBusy } = useClientArchive();

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
    clients,
    clientsQuery,
    query,
    includeArchived,
    editingClient,
    initialFormValues: editingClient ? mapClientToFormValues(editingClient) : emptyClientFormValues,
    isSaving: saveClientMutation.isPending,
    saveError: saveClientMutation.error,
    isArchiveBusy,
    setQuery,
    setIncludeArchived,
    handleEdit,
    handleCancelEdit,
    handleSave,
    handleArchive,
    handleRestore
  };
};
