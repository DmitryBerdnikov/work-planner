import { createRootRouteWithContext, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { ChartNoAxesColumn, Settings } from "lucide-react";
import { clientsQueries, defaultClientsListParams } from "@modules/clients/model/clients-queries";
import {
  appointmentsPageSearchSchema,
  appointmentsQueries,
  defaultAppointmentsListParams
} from "@modules/appointments";
import { defaultCalendarVisibleRange } from "@modules/calendar";
import { AppointmentsPage } from "@pages/appointments-page";
import { CalendarPage } from "@pages/calendar-page";
import { AuthPage } from "@pages/auth-page";
import { ClientsPage } from "@pages/clients-page";
import { DashboardPage } from "@pages/dashboard-page";
import { PendingPage } from "@pages/pending-page";
import { PlaceholderPage } from "@pages/placeholder-page";
import { AppShell } from "@shared/ui/app-shell";
import { queryClient } from "./query-client";
import { RouteError } from "./route-error";
import { requireActiveProfile, requirePendingProfile } from "./route-guards";

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

const pendingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pending",
  beforeLoad: async () => {
    const session = await requirePendingProfile();
    return { session };
  },
  component: PendingPage
});

const calendarRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/calendar",
  loader: async ({ context }) => {
    try {
      await context.queryClient.prefetchQuery(appointmentsQueries.list(defaultCalendarVisibleRange()));
      await context.queryClient.prefetchQuery(appointmentsQueries.clientsForSelect());
    } catch {
      // Active-only route: auth/profile failures are handled in beforeLoad.
    }
  },
  component: CalendarPage
});

const clientsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/clients",
  loader: async ({ context }) => {
    try {
      await context.queryClient.prefetchQuery(clientsQueries.list(defaultClientsListParams));
    } catch {
      // Active-only route: auth/profile failures are handled in beforeLoad.
    }
  },
  component: ClientsPage
});

const reportsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/reports",
  component: () => <PlaceholderPage icon={ChartNoAxesColumn} title="Отчеты" description="Аналитика появится отдельным этапом после запуска production." />
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: () => <PlaceholderPage icon={Settings} title="Настройки" description="Здесь будут профиль, sync status и служебные действия." />
});

const appointmentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/appointments",
  validateSearch: (search) => appointmentsPageSearchSchema.parse(search),
  loader: async ({ context }) => {
    try {
      await context.queryClient.prefetchQuery(appointmentsQueries.list(defaultAppointmentsListParams));
      await context.queryClient.prefetchQuery(appointmentsQueries.clientsForSelect());
    } catch {
      // Active-only route: auth/profile failures are handled in beforeLoad.
    }
  },
  component: AppointmentsPage
});

const routeTree = rootRoute.addChildren([
  authRoute,
  pendingRoute,
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
