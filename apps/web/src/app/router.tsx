import { createRootRouteWithContext, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { CalendarDays, ChartNoAxesColumn, ClipboardList, Settings } from "lucide-react";
import { clientsQueries, defaultClientsListParams } from "@modules/clients/model/clients-queries";
import { AuthPage } from "@pages/auth-page";
import { ClientsPage } from "@pages/clients-page";
import { DashboardPage } from "@pages/dashboard-page";
import { PlaceholderPage } from "@pages/placeholder-page";
import { AppShell } from "@shared/ui/app-shell";
import { queryClient } from "./query-client";
import { RouteError } from "./route-error";
import { redirectUnauthorized, requireActiveProfile } from "./route-guards";

type RouterContext = {
  queryClient: QueryClient;
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  beforeLoad: requireActiveProfile,
  errorComponent: RouteError,
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
  loader: ({ context }) =>
    redirectUnauthorized(context.queryClient.ensureQueryData(clientsQueries.list(defaultClientsListParams))),
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

export const router = createRouter({
  routeTree,
  context: { queryClient }
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
