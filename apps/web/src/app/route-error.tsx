import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { ApiError } from "@shared/api/http";
import { Button } from "@shared/ui/button";

type RouteErrorCopy = {
  title: string;
  description: string;
  action?: "auth";
};

export const RouteError = ({ error, reset }: ErrorComponentProps) => {
  const { title, description, action } = getRouteErrorCopy(error);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-text">
      <section className="w-full max-w-lg rounded-sheet bg-surface p-6 shadow-[0_16px_40px_rgba(48,48,48,0.1)]">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">{description}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {action === "auth" && (
            <Link
              to="/auth"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition active:scale-[0.98]"
            >
              Перейти ко входу
            </Link>
          )}
          <Button className="flex-1" type="button" variant={action === "auth" ? "secondary" : "primary"} onClick={reset}>
            Повторить
          </Button>
        </div>
      </section>
    </main>
  );
};

const getRouteErrorCopy = (error: unknown): RouteErrorCopy => {
  if (error instanceof ApiError && error.status === 401) {
    return {
      title: "Нужно войти в аккаунт",
      description: "Сессия не найдена или истекла. Войдите снова, чтобы открыть рабочие разделы.",
      action: "auth"
    };
  }

  if (error instanceof ApiError && error.status === 403) {
    return {
      title: "Аккаунт ожидает активации",
      description: "Профиль найден, но доступ к рабочим разделам еще не открыт. Активируйте пользователя в базе или проверьте статус профиля."
    };
  }

  return {
    title: "Не удалось открыть раздел",
    description: error instanceof Error ? error.message : "Произошла непредвиденная ошибка. Попробуйте повторить действие."
  };
};
