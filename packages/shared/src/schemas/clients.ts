import { z } from "zod";

import { isoDateTimeSchema, uuidSchema } from "./common";

const clientTextFieldSchema = z.string().trim();

export const clientSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  name: z.string().trim().min(1),
  label: z.string().trim(),
  city: z.string().trim(),
  phone: z.string().trim(),
  telegram: z.string().trim(),
  vk: z.string().trim(),
  instagram: z.string().trim(),
  note: z.string().trim(),
  customData: z.record(z.string(), z.unknown()),
  archivedAt: isoDateTimeSchema.nullable(),
  deletedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  revision: z.number().int().min(0)
});
export type Client = z.infer<typeof clientSchema>;

export const clientIdParamsSchema = z.object({
  id: uuidSchema
});
export type ClientIdParams = z.infer<typeof clientIdParamsSchema>;

export const listClientsQuerySchema = z.object({
  q: z.string().trim().optional(),
  includeArchived: z.enum(["true", "false"]).optional()
});
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;

export const clientsResponseSchema = z.object({
  clients: z.array(clientSchema)
});
export type ClientsResponse = z.infer<typeof clientsResponseSchema>;

export const clientResponseSchema = z.object({
  client: clientSchema
});
export type ClientResponse = z.infer<typeof clientResponseSchema>;

export const createClientPayloadSchema = z.object({
  name: z.string().trim().min(1),
  label: clientTextFieldSchema.optional().default(""),
  city: clientTextFieldSchema.optional().default(""),
  phone: clientTextFieldSchema.optional().default(""),
  telegram: clientTextFieldSchema.optional().default(""),
  vk: clientTextFieldSchema.optional().default(""),
  instagram: clientTextFieldSchema.optional().default(""),
  note: clientTextFieldSchema.optional().default(""),
  customData: z.record(z.string(), z.unknown()).optional().default({})
});
export type CreateClientPayload = z.infer<typeof createClientPayloadSchema>;

export const updateClientPayloadSchema = z.object({
  name: z.string().trim().min(1).optional(),
  label: clientTextFieldSchema.optional(),
  city: clientTextFieldSchema.optional(),
  phone: clientTextFieldSchema.optional(),
  telegram: clientTextFieldSchema.optional(),
  vk: clientTextFieldSchema.optional(),
  instagram: clientTextFieldSchema.optional(),
  note: clientTextFieldSchema.optional(),
  customData: z.record(z.string(), z.unknown()).optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided"
});
export type UpdateClientPayload = z.infer<typeof updateClientPayloadSchema>;
