import { CalendarDays } from "lucide-react";
import {
  AppointmentsCalendar,
  CalendarEventDetail,
  useCalendarPage
} from "@modules/calendar";
import { Notice } from "@shared/ui/notice";

export const CalendarPage = () => {
  const {
    appointments,
    appointmentsQuery,
    selectedAppointment,
    selectedClientName,
    isCancelBusy,
    handleDatesChange,
    handleEventClick,
    handleNavigateToEdit,
    handleNavigateToCreate,
    handleCancelSelected
  } = useCalendarPage();

  return (
    <div className="space-y-5">
      <header className="rounded-sheet bg-surface p-5 shadow-[0_16px_40px_rgba(48,48,48,0.08)] lg:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-4 inline-flex rounded-full bg-accent-blue/15 p-3 text-accent-blue">
              <CalendarDays size={24} />
            </div>
            <h1 className="text-3xl font-bold leading-tight">Календарь</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              День, неделя и месяц. Цвет события зависит от типа и статуса записи.
            </p>
          </div>
          <div className="rounded-card border border-border bg-surface-muted px-4 py-3 text-sm font-bold text-text-muted">
            {appointments.length} в диапазоне
          </div>
        </div>
      </header>

      {appointmentsQuery.isError && (
        <Notice
          title="Календарь недоступен"
          description="Проверьте вход в аккаунт и доступ к API. Новые аккаунты должны быть активированы."
        />
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <AppointmentsCalendar
          appointments={appointments}
          onDateClick={handleNavigateToCreate}
          onDatesChange={handleDatesChange}
          onEventClick={handleEventClick}
        />

        <CalendarEventDetail
          appointment={selectedAppointment}
          clientName={selectedClientName}
          isCancelBusy={isCancelBusy}
          onCancel={handleCancelSelected}
          onCreate={() => handleNavigateToCreate()}
          onEdit={handleNavigateToEdit}
        />
      </section>
    </div>
  );
};
