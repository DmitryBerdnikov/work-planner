import type { LucideIcon } from "lucide-react";

type PlaceholderPageProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const PlaceholderPage = ({ icon: Icon, title, description }: PlaceholderPageProps) => {
  return (
    <section className="rounded-sheet bg-surface p-6 shadow-[0_16px_40px_rgba(48,48,48,0.08)]">
      <div className="mb-4 inline-flex rounded-full bg-surface-muted p-3">
        <Icon size={24} />
      </div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-3 max-w-xl text-text-muted">{description}</p>
    </section>
  );
};
