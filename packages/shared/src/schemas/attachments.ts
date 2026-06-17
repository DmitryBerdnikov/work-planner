import { z } from "zod";

import { isoDateTimeSchema, uuidSchema } from "./common.js";

export const attachmentSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  appointmentId: uuidSchema,
  storageKey: z.string().trim().min(1),
  originalName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.number().int().min(0).max(2 * 1024 * 1024),
  createdAt: isoDateTimeSchema,
  deletedAt: isoDateTimeSchema.nullable(),
  revision: z.number().int().min(0)
});
export type Attachment = z.infer<typeof attachmentSchema>;
