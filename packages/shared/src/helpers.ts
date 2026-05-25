import type { Appointment, AppointmentComputedStatus } from "./schemas";

type AppointmentStatusInput = Pick<Appointment, "status" | "startsAt">;
type SalaryAppointmentInput = Pick<Appointment, "type" | "status" | "startsAt" | "sessionAmount">;
type RemainingAmountInput = Pick<Appointment, "sessionAmount" | "prepaymentAmount">;

export function getAppointmentComputedStatus(
  appointment: AppointmentStatusInput,
  now: Date = new Date()
): AppointmentComputedStatus {
  if (appointment.status === "cancelled") {
    return "cancelled";
  }

  return new Date(appointment.startsAt).getTime() <= now.getTime() ? "completed" : "scheduled";
}

export function isSalaryAppointment(
  appointment: SalaryAppointmentInput,
  now: Date = new Date()
): boolean {
  return appointment.type === "work" && getAppointmentComputedStatus(appointment, now) === "completed";
}

export function calculateRemainingAmount(appointment: RemainingAmountInput): number {
  return Math.max(appointment.sessionAmount - appointment.prepaymentAmount, 0);
}

export function sumSalary(appointments: SalaryAppointmentInput[], now: Date = new Date()): number {
  return appointments.reduce((total, appointment) => {
    return isSalaryAppointment(appointment, now) ? total + appointment.sessionAmount : total;
  }, 0);
}

export function formatMoneyMinor(amount: number, locale = "ru-RU", currency = "RUB"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount / 100);
}
