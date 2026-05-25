import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientPayloadSchema, type CreateClientPayload } from "@work-planner/shared";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { UserPlus } from "lucide-react";
import { Button } from "@shared/ui/button";
import { FormInput } from "@shared/ui/form-input";

type ClientFormProps = {
  initialValues: CreateClientPayload;
  isEditing: boolean;
  isSaving: boolean;
  error: Error | null;
  onSubmit: (payload: CreateClientPayload) => void;
  onCancel: () => void;
};

type ClientFormPayload = z.input<typeof createClientPayloadSchema>;

export const ClientForm = ({
  initialValues,
  isEditing,
  isSaving,
  error,
  onSubmit,
  onCancel
}: ClientFormProps) => {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<ClientFormPayload, unknown, CreateClientPayload>({
    resolver: zodResolver(createClientPayloadSchema),
    values: initialValues
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const title = isEditing ? "Редактировать клиента" : "Новый клиент";
  const submitText = isSaving ? "Сохранение..." : isEditing ? "Сохранить" : "Добавить";

  return (
    <aside className="rounded-card border border-border bg-surface p-5 xl:sticky xl:top-5 xl:self-start">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-full bg-primary p-3 text-primary-foreground">
          <UserPlus size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-text-muted">Имя обязательно, остальные поля можно заполнить позже.</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormInput label="Имя" error={errors.name?.message} required registration={register("name")} />
        <FormInput label="Пометка" registration={register("label")} />
        <FormInput label="Город" registration={register("city")} />
        <FormInput label="Телефон" registration={register("phone")} />
        <FormInput label="Telegram" registration={register("telegram")} />
        <FormInput label="VK" registration={register("vk")} />
        <FormInput label="Instagram" registration={register("instagram")} />
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
