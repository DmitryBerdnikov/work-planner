import { useCallback, useEffect, useRef, useState } from "react";
import type { Client, CreateClientPayload } from "@work-planner/shared";
import { syncWorkPlanner, type WorkPlannerSyncStatus } from "@modules/sync";
import { defaultClientsListParams } from "../model/clients-queries";
import { emptyClientFormValues, mapClientToFormValues } from "../model/clients-form";
import { useInvalidateClients } from "./use-invalidate-clients";
import { useClientArchive } from "./use-client-archive";
import { useClientsList } from "./use-clients-list";
import { useSaveClient } from "./use-save-client";

export const useClientsPage = () => {
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [query, setQuery] = useState(defaultClientsListParams.query);
  const [includeArchived, setIncludeArchived] = useState(defaultClientsListParams.includeArchived);
  const [syncStatus, setSyncStatus] = useState<WorkPlannerSyncStatus>("pending");
  const syncRunIdRef = useRef(0);
  const invalidateClients = useInvalidateClients();

  const { clients, clientsQuery } = useClientsList({ query, includeArchived });

  const startSync = useCallback(() => {
    const syncRunId = syncRunIdRef.current + 1;
    syncRunIdRef.current = syncRunId;
    setSyncStatus("pending");

    syncWorkPlanner()
      .then(async (result) => {
        if (syncRunIdRef.current === syncRunId) {
          setSyncStatus(result.status);
        }

        await invalidateClients();
      })
      .catch(() => {
        if (syncRunIdRef.current === syncRunId) {
          setSyncStatus("failed");
        }
      });
  }, [invalidateClients]);

  useEffect(() => {
    let isMounted = true;

    function syncOnOpen() {
      const syncRunId = syncRunIdRef.current + 1;
      syncRunIdRef.current = syncRunId;
      setSyncStatus("pending");

      syncWorkPlanner()
        .then(async (result) => {
          if (!isMounted || syncRunIdRef.current !== syncRunId) {
            return;
          }

          setSyncStatus(result.status);
          await invalidateClients();
        })
        .catch(() => {
          if (isMounted && syncRunIdRef.current === syncRunId) {
            setSyncStatus("failed");
          }
        });
    }

    syncOnOpen();

    return () => {
      isMounted = false;
    };
  }, [invalidateClients]);

  const saveClientMutation = useSaveClient({
    editingClient,
    onSuccess: () => {
      setEditingClient(null);
      startSync();
    }
  });

  const { handleArchive, handleRestore, isArchiveBusy } = useClientArchive({
    onSuccess: startSync
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
    clients,
    clientsQuery,
    syncStatus,
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
