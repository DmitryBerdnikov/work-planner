import { Lock } from "lucide-react";
import { Button } from "@shared/ui/button";

export const AuthPage = () => {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-text">
      <section className="w-full max-w-md rounded-sheet bg-surface p-6 shadow-[0_16px_40px_rgba(48,48,48,0.1)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full bg-primary p-3 text-primary-foreground">
            <Lock size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Вход в Work Planner</h1>
            <p className="text-sm text-text-muted">Email и пароль. Новые аккаунты ожидают ручной активации.</p>
          </div>
        </div>
        <form className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Email</span>
            <input className="min-h-12 w-full rounded-input border border-border bg-surface-muted px-4 outline-none focus:border-primary" type="email" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Пароль</span>
            <input className="min-h-12 w-full rounded-input border border-border bg-surface-muted px-4 outline-none focus:border-primary" type="password" />
          </label>
          <Button className="w-full" type="button">
            Войти
          </Button>
        </form>
      </section>
    </main>
  );
};
