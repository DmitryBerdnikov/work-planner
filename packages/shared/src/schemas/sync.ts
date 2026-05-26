import { z } from "zod";

import { appointmentSchema } from "./appointments";
import { clientSchema } from "./clients";
import { isoDateTimeSchema, uuidSchema } from "./common";

export const syncEntitySchema = z.enum(["client", "appointment"]);
export type SyncEntity = z.infer<typeof syncEntitySchema>;

export const syncOperationSchema = z.enum(["create", "update", "delete"]);
export type SyncOperation = z.infer<typeof syncOperationSchema>;

export const syncPatchSchema = z.object({
  id: uuidSchema,
  entity: syncEntitySchema,
  entityId: uuidSchema,
  operation: syncOperationSchema,
  changedFields: z.record(z.string(), z.unknown()).default({}),
  baseRevision: z.number().int().min(0),
  clientTimestamp: isoDateTimeSchema
});
export type SyncPatch = z.infer<typeof syncPatchSchema>;

export const syncPushPayloadSchema = z.object({
  patches: z.array(syncPatchSchema)
});
export type SyncPushPayload = z.infer<typeof syncPushPayloadSchema>;

export const syncAppliedPatchSchema = z.object({
  id: uuidSchema,
  entity: syncEntitySchema,
  entityId: uuidSchema,
  revision: z.number().int().min(0),
  updatedAt: isoDateTimeSchema
});
export type SyncAppliedPatch = z.infer<typeof syncAppliedPatchSchema>;

export const syncPushResponseSchema = z.object({
  applied: z.array(syncAppliedPatchSchema)
});
export type SyncPushResponse = z.infer<typeof syncPushResponseSchema>;

export const syncPullQuerySchema = z.object({
  since: isoDateTimeSchema.optional()
});
export type SyncPullQuery = z.infer<typeof syncPullQuerySchema>;

export const syncPullResponseSchema = z.object({
  clients: z.array(clientSchema),
  appointments: z.array(appointmentSchema),
  serverTimestamp: isoDateTimeSchema
});
export type SyncPullResponse = z.infer<typeof syncPullResponseSchema>;
