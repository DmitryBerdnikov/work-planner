import type { UseFormReturn } from "react-hook-form";
import { Button } from "@shared/ui/button";
import { FormInput } from "@shared/ui/form-input";
import type { AuthCredentials, AuthMode } from "../model/auth-form";

type AuthFormProps = {
  mode: AuthMode;
  error: string | null;
  isSubmitting: boolean;
  form: UseFormReturn<AuthCredentials>;
  onSubmit: () => void;
};

export const AuthForm = ({ mode, error, isSubmitting, form, onSubmit }: AuthFormProps) => {
  const {
    register,
    formState: { errors }
  } = form;

  const submitLabel = isSubmitting ? "Отправка..." : mode === "register" ? "Зарегистрироваться" : "Войти";

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <FormInput
        label="Email"
        type="email"
        autoComplete="email"
        required
        error={errors.email?.message}
        registration={register("email")}
      />
      <FormInput
        label="Пароль"
        type="password"
        autoComplete={mode === "register" ? "new-password" : "current-password"}
        required
        error={errors.password?.message}
        registration={register("password")}
      />

      {error && <p className="rounded-card bg-danger/10 p-3 text-sm font-bold text-danger">{error}</p>}

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {submitLabel}
      </Button>
    </form>
  );
};
