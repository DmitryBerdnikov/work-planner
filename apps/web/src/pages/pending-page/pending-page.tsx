import { getRouteApi } from "@tanstack/react-router";
import { PendingStatusPanel, usePendingPage } from "@modules/auth";
import { Button } from "@shared/ui/button";

const pendingRouteApi = getRouteApi("/pending");

export const PendingPage = () => {
  const { session } = pendingRouteApi.useRouteContext();
  const { handleSignOut } = usePendingPage();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-text">
      <section className="w-full max-w-lg rounded-sheet bg-surface p-6 shadow-[0_16px_40px_rgba(48,48,48,0.1)]">
        <PendingStatusPanel email={session.user.email} status={session.profile.status} />

        <Button className="mt-6 w-full" type="button" variant="secondary" onClick={handleSignOut}>
          Выйти
        </Button>
      </section>
    </main>
  );
};
