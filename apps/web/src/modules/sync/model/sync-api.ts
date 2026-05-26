import {
  pullSync,
  pushSync,
  type PullSyncParams,
  type SyncPullResponse,
  type SyncPushPayload,
  type SyncPushResponse
} from "@shared/api/generated/work-planner-api";

export function pushSyncPatches(payload: SyncPushPayload): Promise<SyncPushResponse> {
  return pushSync(payload);
}

export function pullSyncChanges(params?: PullSyncParams): Promise<SyncPullResponse> {
  return pullSync(params);
}
