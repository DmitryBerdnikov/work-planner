import { z } from "zod";

import { isoDateTimeSchema, uuidSchema } from "./common";

export const profileStatusSchema = z.enum(["pending", "active", "blocked"]);
export type ProfileStatus = z.infer<typeof profileStatusSchema>;

export const profileSchema = z.object({
  id: uuidSchema,
  email: z.email(),
  status: profileStatusSchema,
  activatedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema
});
export type Profile = z.infer<typeof profileSchema>;
