import { z } from "zod";

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
