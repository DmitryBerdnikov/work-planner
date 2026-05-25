import { Lock } from "lucide-react";
import { AuthForm, AuthModeSwitch, AuthShell, useAuthPage } from "@modules/auth";

export const AuthPage = () => {
  const { mode, error, isSubmitting, form, handleModeChange, handleSubmit } = useAuthPage();

  return (
    <AuthShell
      icon={Lock}
      title="Вход в Work Planner"
      subtitle="Email и пароль. Новые аккаунты ожидают ручной активации."
    >
      <AuthModeSwitch mode={mode} onModeChange={handleModeChange} />
      <AuthForm mode={mode} error={error} isSubmitting={isSubmitting} form={form} onSubmit={handleSubmit} />
    </AuthShell>
  );
};
