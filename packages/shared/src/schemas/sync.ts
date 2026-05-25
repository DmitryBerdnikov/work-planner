import { z } from "zod";

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
