import type { PropsWithChildren } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, ChartNoAxesColumn, ClipboardList, Settings, Users } from "lucide-react";
import { cn } from "../utils/cn.js";

const navItems = [
  { to: "/appointments", label: "Записи", icon: ClipboardList },
  { to: "/calendar", label: "Календарь", icon: CalendarDays },
  { to: "/clients", label: "Клиенты", icon: Users },
  { to: "/reports", label: "Отчеты", icon: ChartNoAxesColumn },
  { to: "/settings", label: "Настройки", icon: Settings }
] as const;

export const AppShell = ({ children }: PropsWithChildren) => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="min-h-dvh bg-background text-text">
      <aside className="fixed left-0 top-0 hidden h-dvh w-64 border-r border-border bg-surface px-5 py-6 lg:block">
        <Link to="/" className="mb-8 block text-2xl font-bold">
          Work Planner
        </Link>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-full px-4 text-sm font-bold",
                  active ? "bg-primary text-primary-foreground" : "text-text-muted hover:bg-surface-muted hover:text-text"
                )}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="mx-auto min-h-dvh max-w-[1180px] px-4 pb-24 pt-5 lg:ml-64 lg:px-8 lg:pb-8">
        {children}
      </main>
      <nav className="fixed inset-x-3 bottom-3 grid grid-cols-5 rounded-[28px] border border-border bg-surface p-2 shadow-[0_16px_40px_rgba(48,48,48,0.12)] lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-3xl text-[11px] font-bold",
                active ? "bg-primary text-primary-foreground" : "text-text-muted"
              )}
            >
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
