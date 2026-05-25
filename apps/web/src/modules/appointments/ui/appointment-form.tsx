import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Client } from "@shared/api/generated/work-planner-api";
import { Button } from "@shared/ui/button";
import { FormInput } from "@shared/ui/form-input";
import {
  appointmentFormSchema,
  type AppointmentFormPayload,
  type AppointmentFormValues
} from "../model/appointments-form";

type AppointmentFormProps = {
  clients: Client[];
  initialValues: AppointmentFormValues;
  isEditing: boolean;
  isSaving: boolean;
  error: Error | null;
  onSubmit: (payload: AppointmentFormPayload) => void;
  onCancel: () => void;
};

export const AppointmentForm = ({
  clients,
  initialValues,
  isEditing,
  isSaving,
  error,
  onSubmit,
  onCancel
}: AppointmentFormProps) => {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<AppointmentFormValues, unknown, AppointmentFormPayload>({
    resolver: zodResolver(appointmentFormSchema),
    values: initialValues
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const title = isEditing ? "Редактировать запись" : "Новая запись";
  const submitText = isSaving ? "Сохранение..." : isEditing ? "Сохранить" : "Добавить";

  return (
    <aside className="rounded-card border border-border bg-surface p-5 xl:sticky xl:top-5 xl:self-start">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-full bg-primary p-3 text-primary-foreground">
          <CalendarPlus size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-text-muted">Клиент необязателен, если это личное время или рисование.</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormInput label="Название" error={errors.title?.message} required registration={register("title")} />
        <FormInput
          label="Дата и время"
          type="datetime-local"
          error={errors.startsAtLocal?.message}
          required
          registration={register("startsAtLocal")}
        />

        <label className="block">
          <span className="mb-2 block text-sm font-bold">Тип</span>
          <select
            className="min-h-12 w-full rounded-input border border-border bg-surface-muted px-4 outline-none focus:border-primary"
            {...register("type")}
          >
            <option value="work">Работа</option>
            <option value="personal">Личное</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold">Клиент</span>
          <select
            className="min-h-12 w-full rounded-input border border-border bg-surface-muted px-4 outline-none focus:border-primary"
            {...register("clientId")}
          >
            <option value="">Без клиента</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label ? `${client.name} · ${client.label}` : client.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Стоимость, ₽"
            type="number"
            error={errors.sessionAmountRub?.message}
            required
            registration={register("sessionAmountRub")}
          />
          <FormInput
            label="Предоплата, ₽"
            type="number"
            error={errors.prepaymentAmountRub?.message}
            required
            registration={register("prepaymentAmountRub")}
          />
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-bold">Заметка</span>
          <textarea
            className="min-h-24 w-full resize-y rounded-input border border-border bg-surface-muted px-4 py-3 outline-none focus:border-primary"
            {...register("note")}
          />
        </label>

        {error && <p className="rounded-card bg-danger/10 p-3 text-sm font-bold text-danger">{error.message}</p>}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" disabled={isSaving} type="submit">
            {submitText}
          </Button>
          {isEditing && (
            <Button className="flex-1" type="button" variant="secondary" onClick={onCancel}>
              Отменить
            </Button>
          )}
        </div>
      </form>
    </aside>
  );
};
