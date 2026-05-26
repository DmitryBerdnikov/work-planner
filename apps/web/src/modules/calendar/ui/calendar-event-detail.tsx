import type { AppointmentsResponseAppointmentsItem } from "@shared/api/generated/work-planner-api";
import { CalendarClock, CircleDollarSign, Pencil, Plus, XCircle } from "lucide-react";
import { calculateRemainingAmount, formatMoneyMinor } from "@work-planner/shared";
import { cn } from "@shared/lib/cn";
import { Button } from "@shared/ui/button";

type CalendarEventDetailProps = {
  appointment: AppointmentsResponseAppointmentsItem | null;
  clientName?: string;
  isCancelBusy: boolean;
  onEdit: (appointment: AppointmentsResponseAppointmentsItem) => void;
  onCancel: (appointment: AppointmentsResponseAppointmentsItem) => void;
  onCreate: () => void;
};

const typeLabels = {
  work: "Работа",
  personal: "Личное"
} as const;

const statusLabels = {
  scheduled: "Запланирована",
  completed: "Завершена",
  cancelled: "Отменена"
} as const;

export const CalendarEventDetail = ({
  appointment,
  clientName,
  isCancelBusy,
  onEdit,
  onCancel,
  onCreate
}: CalendarEventDetailProps) => {
  if (!appointment) {
    return (
      <aside className="rounded-card border border-border bg-surface p-5 xl:sticky xl:top-5 xl:self-start">
        <h2 className="text-lg font-bold">Детали записи</h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Выберите событие в календаре или кликните по свободному слоту, чтобы создать запись.
        </p>
        <Button className="mt-4 w-full" type="button" onClick={onCreate}>
          <Plus size={18} className="mr-2 inline" />
          Новая запись
        </Button>
      </aside>
    );
  }

  const isCancelled = appointment.computedStatus === "cancelled";
  const remainingAmount = calculateRemainingAmount(appointment);

  return (
    <aside className="rounded-card border border-border bg-surface p-5 xl:sticky xl:top-5 xl:self-start">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold">{appointment.title}</h2>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            appointment.type === "work" ? "bg-primary/15 text-text" : "bg-accent-blue/15 text-accent-blue"
          )}
        >
          {typeLabels[appointment.type]}
        </span>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            appointment.computedStatus === "completed" && "bg-success/20 text-text",
            appointment.computedStatus === "scheduled" && "bg-warning/20 text-text",
            appointment.computedStatus === "cancelled" && "bg-danger/10 text-danger"
          )}
        >
          {statusLabels[appointment.computedStatus]}
        </span>
      </div>

      <div className="space-y-2 text-sm text-text-muted">
        <p className="flex items-center gap-2">
          <CalendarClock size={16} />
          {formatDateTime(appointment.startsAt)}
        </p>
        <p className="flex items-center gap-2">
          <CircleDollarSign size={16} />
          {formatMoneyMinor(appointment.sessionAmount)}
        </p>
        <p>{clientName ? `Клиент: ${clientName}` : "Без клиента"}</p>
        <p>Доплатить: {formatMoneyMinor(remainingAmount)}</p>
        {appointment.note && <p className="leading-6">{appointment.note}</p>}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" type="button" variant="secondary" onClick={() => onEdit(appointment)}>
          <Pencil size={18} className="mr-2 inline" />
          Редактировать
        </Button>
        {!isCancelled && (
          <Button
            className="flex-1"
            disabled={isCancelBusy}
            type="button"
            variant="secondary"
            onClick={() => onCancel(appointment)}
          >
            <XCircle size={18} className="mr-2 inline" />
            Отменить
          </Button>
        )}
      </div>
    </aside>
  );
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
