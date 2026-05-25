import { z } from "zod";
import type {
  AppointmentsResponseAppointmentsItem,
  CreateAppointmentPayload,
  UpdateAppointmentPayload
} from "@shared/api/generated/work-planner-api";

export const appointmentFormSchema = z.object({
  title: z.string().trim().min(1, "Укажите название"),
  startsAtLocal: z.string().min(1, "Укажите дату и время"),
  clientId: z.string().default(""),
  type: z.enum(["work", "personal"]),
  sessionAmountRub: z.coerce.number().min(0, "Стоимость не может быть меньше 0"),
  prepaymentAmountRub: z.coerce.number().min(0, "Предоплата не может быть меньше 0"),
  note: z.string().trim().default("")
}).refine((value) => value.prepaymentAmountRub <= value.sessionAmountRub, {
  message: "Предоплата не может быть больше стоимости",
  path: ["prepaymentAmountRub"]
});

export type AppointmentFormValues = z.input<typeof appointmentFormSchema>;
export type AppointmentFormPayload = z.output<typeof appointmentFormSchema>;

export const emptyAppointmentFormValues = (): AppointmentFormValues => ({
  title: "",
  startsAtLocal: toDateTimeLocalInputValue(new Date(Date.now() + 60 * 60 * 1000).toISOString()),
  clientId: "",
  type: "work",
  sessionAmountRub: 0,
  prepaymentAmountRub: 0,
  note: ""
});

export const mapAppointmentToFormValues = (appointment: AppointmentsResponseAppointmentsItem): AppointmentFormValues => {
  return {
    title: appointment.title,
    startsAtLocal: toDateTimeLocalInputValue(appointment.startsAt),
    clientId: appointment.clientId ?? "",
    type: appointment.type,
    sessionAmountRub: toRubles(appointment.sessionAmount),
    prepaymentAmountRub: toRubles(appointment.prepaymentAmount),
    note: appointment.note ?? ""
  };
};

export const mapFormToCreatePayload = (payload: AppointmentFormPayload): CreateAppointmentPayload => {
  return {
    title: payload.title,
    startsAt: new Date(payload.startsAtLocal).toISOString(),
    clientId: payload.clientId || null,
    type: payload.type,
    sessionAmount: toMinorUnits(payload.sessionAmountRub),
    prepaymentAmount: toMinorUnits(payload.prepaymentAmountRub),
    note: payload.note,
    customData: {}
  };
};

export const mapFormToUpdatePayload = (payload: AppointmentFormPayload): UpdateAppointmentPayload => {
  return mapFormToCreatePayload(payload);
};

export const toDateTimeLocalInputValue = (isoDateTime: string): string => {
  const date = new Date(isoDateTime);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;

  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
};

function toRubles(amount: number): number {
  return amount / 100;
}

function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}
