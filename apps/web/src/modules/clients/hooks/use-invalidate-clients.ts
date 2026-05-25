import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { clientsQueries } from "../model/clients-queries";

export const useInvalidateClients = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: clientsQueries.all })
  }, [queryClient]);
};
