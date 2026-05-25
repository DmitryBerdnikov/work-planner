import { z } from "zod";
import { isoDateTimeSchema } from "./common";
import { profileStatusSchema } from "./profiles";

export const apiErrorSchema = z.object({
  error: z.string(),
  issues: z.array(z.unknown()).optional()
});
export type ApiErrorPayload = z.infer<typeof apiErrorSchema>;

export const healthResponseSchema = z.object({
  ok: z.boolean(),
  environment: z.string(),
  version: z.string()
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const currentUserSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  name: z.string().min(1),
  image: z.string().nullable().optional(),
  emailVerified: z.boolean()
});
export type CurrentUser = z.infer<typeof currentUserSchema>;

export const currentUserResponseSchema = z.object({
  user: currentUserSchema
});
export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>;

export const sessionProfileSchema = z.object({
  status: profileStatusSchema,
  activatedAt: isoDateTimeSchema.nullable()
});
export type SessionProfile = z.infer<typeof sessionProfileSchema>;

export const sessionResponseSchema = z.object({
  user: currentUserSchema,
  profile: sessionProfileSchema
});
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
