import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "@shared/api/generated/work-planner-api";

export const useDashboardPage = () => {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth
  });

  return { healthQuery };
};
