import { z } from "zod";

import { isoDateTimeSchema, moneyAmountSchema, uuidSchema } from "./common";

export const appointmentTypeSchema = z.enum(["work", "personal"]);
export type AppointmentType = z.infer<typeof appointmentTypeSchema>;

export const appointmentStoredStatusSchema = z.enum(["scheduled", "cancelled"]);
export type AppointmentStoredStatus = z.infer<typeof appointmentStoredStatusSchema>;

export const appointmentComputedStatusSchema = z.enum(["scheduled", "completed", "cancelled"]);
export type AppointmentComputedStatus = z.infer<typeof appointmentComputedStatusSchema>;

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

export const appointmentWithComputedStatusSchema = appointmentSchema.extend({
  computedStatus: appointmentComputedStatusSchema
});
export type AppointmentWithComputedStatus = z.infer<typeof appointmentWithComputedStatusSchema>;

export const appointmentIdParamsSchema = z.object({
  id: uuidSchema
});
export type AppointmentIdParams = z.infer<typeof appointmentIdParamsSchema>;

export const listAppointmentsQuerySchema = z.object({
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional()
});
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;

export const appointmentsResponseSchema = z.object({
  appointments: z.array(appointmentWithComputedStatusSchema)
});
export type AppointmentsResponse = z.infer<typeof appointmentsResponseSchema>;

export const appointmentResponseSchema = z.object({
  appointment: appointmentWithComputedStatusSchema
});
export type AppointmentResponse = z.infer<typeof appointmentResponseSchema>;

const appointmentPayloadFieldsSchema = z.object({
  clientId: uuidSchema.nullable().optional().default(null),
  startsAt: isoDateTimeSchema,
  title: z.string().trim().min(1),
  type: appointmentTypeSchema,
  sessionAmount: moneyAmountSchema,
  prepaymentAmount: moneyAmountSchema,
  note: z.string().trim().optional().default(""),
  customData: z.record(z.string(), z.unknown()).optional().default({})
});

export const createAppointmentPayloadSchema = appointmentPayloadFieldsSchema.refine((value) => value.prepaymentAmount <= value.sessionAmount, {
  message: "prepaymentAmount must not exceed sessionAmount",
  path: ["prepaymentAmount"]
});
export type CreateAppointmentPayload = z.infer<typeof createAppointmentPayloadSchema>;

export const updateAppointmentPayloadSchema = appointmentPayloadFieldsSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided"
}).refine((value) => {
  if (value.sessionAmount === undefined || value.prepaymentAmount === undefined) {
    return true;
  }

  return value.prepaymentAmount <= value.sessionAmount;
}, {
  message: "prepaymentAmount must not exceed sessionAmount",
  path: ["prepaymentAmount"]
});
export type UpdateAppointmentPayload = z.infer<typeof updateAppointmentPayloadSchema>;
