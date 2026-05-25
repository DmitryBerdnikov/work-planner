import { ClipboardList } from "lucide-react";
import { useAppointmentsPage } from "@modules/appointments";
import { AppointmentCard } from "@modules/appointments/ui/appointment-card";
import { AppointmentForm } from "@modules/appointments/ui/appointment-form";
import { Notice } from "@shared/ui/notice";

export const AppointmentsPage = () => {
  const {
    appointments,
    appointmentsQuery,
    clients,
    clientsQuery,
    clientNameById,
    editingAppointment,
    initialFormValues,
    isSaving,
    saveError,
    isCancelBusy,
    handleEdit,
    handleCancelEdit,
    handleSave,
    handleCancel
  } = useAppointmentsPage();

  return (
    <div className="space-y-5">
      <header className="rounded-sheet bg-surface p-5 shadow-[0_16px_40px_rgba(48,48,48,0.08)] lg:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-4 inline-flex rounded-full bg-primary/15 p-3 text-text">
              <ClipboardList size={24} />
            </div>
            <h1 className="text-3xl font-bold leading-tight">Записи</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              Рабочие сеансы и личное время. Запись может быть без клиента.
            </p>
          </div>
          <div className="rounded-card border border-border bg-surface-muted px-4 py-3 text-sm font-bold text-text-muted">
            {appointments.length} в списке
          </div>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          {appointmentsQuery.isLoading && <Notice title="Загрузка записей" description="Получаем данные с сервера." />}
          {appointmentsQuery.isError && (
            <Notice
              title="Записи недоступны"
              description="Проверьте вход в аккаунт и доступ к API. Новые аккаунты должны быть активированы."
            />
          )}
          {!appointmentsQuery.isLoading && !appointmentsQuery.isError && appointments.length === 0 && (
            <Notice title="Записей пока нет" description="Добавьте первую запись через форму справа." />
          )}
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              clientName={appointment.clientId ? clientNameById.get(appointment.clientId) : undefined}
              isBusy={isCancelBusy}
              onEdit={handleEdit}
              onCancel={handleCancel}
            />
          ))}
        </div>

        <AppointmentForm
          clients={clients}
          error={saveError}
          initialValues={initialFormValues}
          isEditing={Boolean(editingAppointment)}
          isSaving={isSaving}
          onCancel={handleCancelEdit}
          onSubmit={handleSave}
        />

        {clientsQuery.isError && (
          <Notice title="Клиенты не загрузились" description="Запись можно создать без клиента и позже отредактировать." />
        )}
      </section>
    </div>
  );
};
