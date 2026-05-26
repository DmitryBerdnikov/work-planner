import type { AppointmentWithComputedStatus } from "@work-planner/shared";
import { CalendarClock, CircleDollarSign, Pencil, XCircle } from "lucide-react";
import { calculateRemainingAmount, formatMoneyMinor } from "@work-planner/shared";
import { cn } from "@shared/lib/cn";
import { Button } from "@shared/ui/button";

type AppointmentCardProps = {
  appointment: AppointmentWithComputedStatus;
  clientName?: string;
  isBusy: boolean;
  onEdit: (appointment: AppointmentWithComputedStatus) => void;
  onCancel: (appointment: AppointmentWithComputedStatus) => void;
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

export const AppointmentCard = ({
  appointment,
  clientName,
  isBusy,
  onEdit,
  onCancel
}: AppointmentCardProps) => {
  const isCancelled = appointment.computedStatus === "cancelled";
  const remainingAmount = calculateRemainingAmount(appointment);

  return (
    <article className={cn("rounded-card border border-border bg-surface p-4", isCancelled && "bg-surface-muted")}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold">{appointment.title}</h3>
            <span className={cn(
              "rounded-full px-3 py-1 text-xs font-bold",
              appointment.type === "work" ? "bg-primary/15 text-text" : "bg-accent-blue/15 text-accent-blue"
            )}>
              {typeLabels[appointment.type]}
            </span>
            <span className={cn(
              "rounded-full px-3 py-1 text-xs font-bold",
              appointment.computedStatus === "completed" && "bg-success/20 text-text",
              appointment.computedStatus === "scheduled" && "bg-warning/20 text-text",
              appointment.computedStatus === "cancelled" && "bg-danger/10 text-danger"
            )}>
              {statusLabels[appointment.computedStatus]}
            </span>
          </div>

          <div className="grid gap-2 text-sm text-text-muted sm:grid-cols-2">
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
          </div>

          {appointment.note && <p className="max-w-2xl text-sm leading-6 text-text-muted">{appointment.note}</p>}
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            aria-label={`Редактировать ${appointment.title}`}
            className="size-11 p-0"
            type="button"
            variant="secondary"
            onClick={() => onEdit(appointment)}
          >
            <Pencil size={18} />
          </Button>
          {!isCancelled && (
            <Button
              aria-label={`Отменить ${appointment.title}`}
              className="size-11 p-0"
              disabled={isBusy}
              type="button"
              variant="secondary"
              onClick={() => onCancel(appointment)}
            >
              <XCircle size={18} />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
