import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { CalendarDays, ChartNoAxesColumn, ClipboardList, Settings } from "lucide-react";
import { AppShell } from "./ui/app-shell.js";
import { AuthPage } from "./views/auth-page.js";
import { ClientsPage } from "./views/clients-page.js";
import { DashboardPage } from "./views/dashboard-page.js";
import { PlaceholderPage } from "./views/placeholder-page.js";

const rootRoute = createRootRoute({
  component: () => <Outlet />
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  )
});

const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: DashboardPage
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: AuthPage
});

const calendarRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/calendar",
  component: () => <PlaceholderPage icon={CalendarDays} title="Календарь" description="Здесь будет календарь записей с day/week/month режимами." />
});

const clientsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/clients",
  component: ClientsPage
});

const reportsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/reports",
  component: () => <PlaceholderPage icon={ChartNoAxesColumn} title="Отчеты" description="Здесь будут зарплата по месяцам и количество рабочих сеансов." />
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: () => <PlaceholderPage icon={Settings} title="Настройки" description="Здесь будут профиль, sync status и служебные действия." />
});

const appointmentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/appointments",
  component: () => <PlaceholderPage icon={ClipboardList} title="Записи" description="Здесь будет список записей и быстрые действия." />
});

const routeTree = rootRoute.addChildren([
  authRoute,
  appRoute.addChildren([indexRoute, appointmentsRoute, calendarRoute, clientsRoute, reportsRoute, settingsRoute])
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
