import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type AuthShellProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export const AuthShell = ({ icon: Icon, title, subtitle, children }: AuthShellProps) => {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-text">
      <section className="w-full max-w-md rounded-sheet bg-surface p-6 shadow-[0_16px_40px_rgba(48,48,48,0.1)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full bg-primary p-3 text-primary-foreground">
            <Icon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-text-muted">{subtitle}</p>
          </div>
        </div>
        {children}
      </section>
    </main>
  );
};
