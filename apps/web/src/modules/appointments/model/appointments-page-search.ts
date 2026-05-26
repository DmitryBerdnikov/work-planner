import { z } from "zod";

export const appointmentsPageSearchSchema = z.object({
  editId: z.string().optional(),
  startsAt: z.string().optional()
});

export type AppointmentsPageSearch = z.infer<typeof appointmentsPageSearchSchema>;
