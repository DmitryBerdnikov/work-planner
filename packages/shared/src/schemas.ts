import { z } from "zod";

export const profileStatusSchema = z.enum(["pending", "active", "blocked"]);
export type ProfileStatus = z.infer<typeof profileStatusSchema>;

export const appointmentTypeSchema = z.enum(["work", "personal"]);
export type AppointmentType = z.infer<typeof appointmentTypeSchema>;

export const appointmentStoredStatusSchema = z.enum(["scheduled", "cancelled"]);
export type AppointmentStoredStatus = z.infer<typeof appointmentStoredStatusSchema>;

export const appointmentComputedStatusSchema = z.enum(["scheduled", "completed", "cancelled"]);
export type AppointmentComputedStatus = z.infer<typeof appointmentComputedStatusSchema>;

export const syncEntitySchema = z.enum(["client", "appointment"]);
export type SyncEntity = z.infer<typeof syncEntitySchema>;

export const syncOperationSchema = z.enum(["create", "update", "delete"]);
export type SyncOperation = z.infer<typeof syncOperationSchema>;

export const uuidSchema = z.uuid();
export const isoDateTimeSchema = z.iso.datetime({ offset: true });
export const moneyAmountSchema = z.number().int().min(0);
const clientTextFieldSchema = z.string().trim();

export const profileSchema = z.object({
  id: uuidSchema,
  email: z.email(),
  status: profileStatusSchema,
  activatedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema
});
export type Profile = z.infer<typeof profileSchema>;

export const clientSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  name: z.string().trim().min(1),
  label: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  telegram: z.string().trim().optional().default(""),
  vk: z.string().trim().optional().default(""),
  instagram: z.string().trim().optional().default(""),
  note: z.string().trim().optional().default(""),
  customData: z.record(z.string(), z.unknown()).default({}),
  archivedAt: isoDateTimeSchema.nullable(),
  deletedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  revision: z.number().int().min(0)
});
export type Client = z.infer<typeof clientSchema>;

export const createClientInputSchema = z.object({
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
export type CreateClientInput = z.infer<typeof createClientInputSchema>;

export const updateClientInputSchema = z.object({
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
export type UpdateClientInput = z.infer<typeof updateClientInputSchema>;

export const appointmentSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  clientId: uuidSchema.nullable(),
  startsAt: isoDateTimeSchema,
  title: z.string().trim().min(1),
  type: appointmentTypeSchema,
  status: appointmentStoredStatusSchema,
  sessionAmount: moneyAmountSchema,
  prepaymentAmount: moneyAmountSchema,
  note: z.string().trim().optional().default(""),
  customData: z.record(z.string(), z.unknown()).default({}),
  deletedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  revision: z.number().int().min(0)
}).refine((value) => value.prepaymentAmount <= value.sessionAmount, {
  message: "prepaymentAmount must not exceed sessionAmount",
  path: ["prepaymentAmount"]
});
export type Appointment = z.infer<typeof appointmentSchema>;

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
