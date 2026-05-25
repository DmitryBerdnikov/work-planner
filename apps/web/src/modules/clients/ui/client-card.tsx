import type { Client } from "@work-planner/shared";
import { Archive, Pencil, RotateCcw } from "lucide-react";
import { cn } from "@shared/lib/cn";
import { Button } from "@shared/ui/button";

type ClientCardProps = {
  client: Client;
  isBusy: boolean;
  onEdit: (client: Client) => void;
  onArchive: (client: Client) => void;
  onRestore: (client: Client) => void;
};

export const ClientCard = ({
  client,
  isBusy,
  onEdit,
  onArchive,
  onRestore
}: ClientCardProps) => {
  const isArchived = Boolean(client.archivedAt);

  return (
    <article className={cn("rounded-card border border-border bg-surface p-4", isArchived && "bg-surface-muted")}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold">{client.name}</h3>
            {client.label && <span className="rounded-full bg-accent-pink/15 px-3 py-1 text-xs font-bold text-text">{client.label}</span>}
            {isArchived && <span className="rounded-full bg-warning/20 px-3 py-1 text-xs font-bold text-text">Архив</span>}
          </div>
          <div className="grid gap-1 text-sm text-text-muted sm:grid-cols-2">
            {client.city && <p>{client.city}</p>}
            {client.phone && <p>{client.phone}</p>}
            {client.telegram && <p>{client.telegram}</p>}
            {client.instagram && <p>{client.instagram}</p>}
            {client.vk && <p>{client.vk}</p>}
          </div>
          {client.note && <p className="max-w-2xl text-sm leading-6 text-text-muted">{client.note}</p>}
        </div>

        <div className="flex shrink-0 gap-2">
          <Button aria-label={`Редактировать ${client.name}`} className="size-11 p-0" type="button" variant="secondary" onClick={() => onEdit(client)}>
            <Pencil size={18} />
          </Button>
          {isArchived ? (
            <Button
              aria-label={`Вернуть ${client.name} из архива`}
              className="size-11 p-0"
              disabled={isBusy}
              type="button"
              variant="secondary"
              onClick={() => onRestore(client)}
            >
              <RotateCcw size={18} />
            </Button>
          ) : (
            <Button
              aria-label={`Архивировать ${client.name}`}
              className="size-11 p-0"
              disabled={isBusy}
              type="button"
              variant="secondary"
              onClick={() => onArchive(client)}
            >
              <Archive size={18} />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};
