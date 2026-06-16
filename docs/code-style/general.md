# Общий стиль кода

- Backend: [backend.md](backend/backend.md)
- Frontend: [frontend.md](frontend/frontend.md)

Applies to all files: `apps/*`, `packages/*`.

- Имя файлов и папок kebab-case (`dashboard-page.tsx`), если это позволяет язык на котором написан файл.
- Для предикатов использовать префиксы `is`, `can`: `isDeleted`, `canRead`

## `packages/shared`

- Без зависимостей от React, Drizzle, Hono.
- Zod-схемы и pure helpers — единый контракт для web и api.
- Бизнес-логика без доступа к БД (см. helpers в `packages/shared/src`).

## CI

- `pnpm lint` — в т.ч. `@typescript-eslint/consistent-type-definitions: type`.
- `pnpm typecheck`, `pnpm test` — см. [rules-and-testing.md](../rules-and-testing.md).
