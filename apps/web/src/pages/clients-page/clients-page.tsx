import { Search, Users } from "lucide-react";
import { useClientsPage } from "@modules/clients";
import { ClientCard } from "@modules/clients/ui/client-card";
import { ClientForm } from "@modules/clients/ui/client-form";
import { Notice } from "@shared/ui/notice";

export const ClientsPage = () => {
  const {
    clients,
    clientsQuery,
    syncStatus,
    query,
    includeArchived,
    editingClient,
    initialFormValues,
    isSaving,
    saveError,
    isArchiveBusy,
    setQuery,
    setIncludeArchived,
    handleEdit,
    handleCancelEdit,
    handleSave,
    handleArchive,
    handleRestore
  } = useClientsPage();

  return (
    <div className="space-y-5">
      <header className="rounded-sheet bg-surface p-5 shadow-[0_16px_40px_rgba(48,48,48,0.08)] lg:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-4 inline-flex rounded-full bg-accent-blue/15 p-3 text-accent-blue">
              <Users size={24} />
            </div>
            <h1 className="text-3xl font-bold leading-tight">Клиенты</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              Список клиентов, контакты и пометки для различения людей с одинаковыми именами.
            </p>
          </div>
          <div className="rounded-card border border-border bg-surface-muted px-4 py-3 text-sm font-bold text-text-muted">
            <div>{clients.length} в списке</div>
            <div className="mt-1 text-xs font-semibold">{syncStatusLabel[syncStatus]}</div>
          </div>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  className="min-h-12 w-full rounded-input border border-border bg-surface-muted pl-11 pr-4 outline-none focus:border-primary"
                  placeholder="Поиск по имени, пометке, телефону или Telegram"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-input border border-border bg-surface-muted px-4 text-sm font-bold">
                <input
                  className="size-4 accent-[var(--color-primary)]"
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(event) => setIncludeArchived(event.target.checked)}
                />
                Архив
              </label>
            </div>
          </div>

          <div className="space-y-3">
            {clientsQuery.isLoading && <Notice title="Загрузка клиентов" description="Читаем локальную базу." />}
            {clientsQuery.isError && (
              <Notice
                title="Клиенты недоступны"
                description="Не удалось прочитать локальную базу клиентов."
              />
            )}
            {!clientsQuery.isLoading && !clientsQuery.isError && clients.length === 0 && (
              <Notice title="Клиентов пока нет" description="Добавьте первого клиента через форму справа." />
            )}
            {clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                isBusy={isArchiveBusy}
                onEdit={handleEdit}
                onArchive={handleArchive}
                onRestore={handleRestore}
              />
            ))}
          </div>
        </div>

        <ClientForm
          error={saveError}
          initialValues={initialFormValues}
          isEditing={Boolean(editingClient)}
          isSaving={isSaving}
          onCancel={handleCancelEdit}
          onSubmit={handleSave}
        />
      </section>
    </div>
  );
};

const syncStatusLabel = {
  synced: "Синхронизировано",
  pending: "Ожидает синхронизации",
  failed: "Синхронизация не удалась"
} as const;
