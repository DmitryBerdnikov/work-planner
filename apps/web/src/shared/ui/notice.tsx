type NoticeProps = {
  title: string;
  description: string;
};

export const Notice = ({ title, description }: NoticeProps) => {
  return (
    <section className="rounded-card border border-border bg-surface p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
    </section>
  );
};
