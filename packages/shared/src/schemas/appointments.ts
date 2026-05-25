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
