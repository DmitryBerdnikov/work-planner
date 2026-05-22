import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, CircleDollarSign, Wifi } from "lucide-react";
import { formatMoneyMinor } from "@work-planner/shared";
import { fetchHealth } from "../api/client.js";
import { Button } from "../ui/button.js";

export const DashboardPage = () => {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth
  });

  return (
    <div className="space-y-6">
      <header className="rounded-sheet bg-surface p-5 shadow-[0_16px_40px_rgba(48,48,48,0.08)] lg:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-text-muted">Сегодня</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight">План записей и личного времени</h1>
          </div>
          <div className="rounded-full bg-surface-muted p-3">
            <CalendarPlus size={24} />
          </div>
        </div>
        <Button className="w-full sm:w-auto">Добавить запись</Button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-card border border-border bg-surface p-5">
          <p className="text-sm font-bold text-text-muted">Зарплата за месяц</p>
          <p className="mt-3 text-3xl font-bold tabular-nums">{formatMoneyMinor(0)}</p>
        </article>
        <article className="rounded-card border border-border bg-surface p-5">
          <p className="text-sm font-bold text-text-muted">Рабочие сеансы</p>
          <p className="mt-3 text-3xl font-bold tabular-nums">0</p>
        </article>
        <article className="rounded-card border border-border bg-surface p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-text-muted">
            <Wifi size={16} />
            API
          </div>
          <p className="mt-3 text-base font-bold">
            {health.isLoading ? "Проверка..." : health.data?.ok ? health.data.environment : "Недоступен"}
          </p>
        </article>
      </section>

      <section className="rounded-card border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-accent-green/15 p-3 text-accent-green">
            <CircleDollarSign size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Ближайшие записи</h2>
            <p className="text-sm text-text-muted">CRUD и offline-sync будут добавлены следующим этапом.</p>
          </div>
        </div>
        <div className="rounded-card bg-surface-muted p-5 text-sm font-medium text-text-muted">
          Пока записей нет. Этот экран фиксирует layout, дизайн-токены и базовую связку web/API.
        </div>
      </section>
    </div>
  );
};
