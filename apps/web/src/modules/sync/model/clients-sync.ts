import { syncWorkPlanner, type WorkPlannerSyncStatus } from "./work-planner-sync";

export type ClientsSyncStatus = WorkPlannerSyncStatus;

export const syncClients = syncWorkPlanner;
