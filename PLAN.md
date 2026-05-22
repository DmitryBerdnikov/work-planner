# План Создания Work Planner

## Summary

Цель: собрать production-ready веб-приложение на уже выбранном стеке: `React/Vite`, `Hono`, `SQLite + Drizzle`, `Better Auth`, `Dexie`, `PWA`, `Caddy + systemd`, `GitHub Actions`.

Работа идет по этапам: сначала каркас и архитектурные границы, потом backend foundation, затем frontend foundation, потом CRUD, offline-sync, фото, отчеты, тесты и деплой.

## Дизайн И Frontend Архитектура

Выбранный frontend-подход:

- UI-стиль: спокойный рабочий интерфейс, ближе к CRM/календарю, без лендинга, hero-блоков и декоративной графики.
- Layout: левая навигация на desktop, bottom navigation на mobile.
- Основные разделы: `Записи`, `Календарь`, `Клиенты`, `Отчеты`, `Настройки`.
- UI stack: `Tailwind CSS + shadcn/ui + lucide-react`.
- Router: `TanStack Router`.
- Server state: `TanStack Query`.
- Forms: `React Hook Form + Zod`.
- Local/offline state: `Dexie`.
- Calendar: `FullCalendar`.
- Charts: `Recharts`.
- Tests: `Vitest + Testing Library + Playwright + MSW`.

Экранная логика:

- Первый экран после входа: список ближайших записей + быстрые действия.
- Календарь: day/week/month views, цвет по `type/status`.
- Форма записи: `title`, `type`, `starts_at`, optional client, amount, prepayment, note, photos only online.
- Клиенты: список, поиск, архив, карточка клиента, связанные записи.
- Отчеты: зарплата по месяцам, количество рабочих сеансов, фильтры периода.

## Backend Архитектура

Выбранная backend-архитектура:

- `apps/api` делится на слои: `routes`, `features`, `db`, `auth`, `services`, `config`.
- `routes` только принимает HTTP и вызывает feature/service logic.
- `features` содержит бизнес-логику по clients, appointments, attachments, sync.
- `db` содержит Drizzle schema, migrations, query helpers.
- `services` содержит storage, backup helpers, sync engine, healthcheck.
- `packages/shared` содержит Zod-схемы, типы DTO, sync contracts и общую бизнес-логику без доступа к БД.
- Backend не отдает frontend напрямую в dev, но production отдача идет через Caddy.

Главные backend-инварианты:

- Все пользовательские данные имеют `user_id`.
- Доступ к рабочим API разрешен только `profile.status = active`.
- `appointment.client_id` nullable.
- `appointment.type = work | personal`.
- В базе `appointment.status = scheduled | cancelled`.
- `completed` вычисляется через `starts_at <= now`.
- Зарплата считается только по `work`, не `cancelled`, `starts_at <= now`.
- Фото хранятся локально через `StorageService`, чтобы потом заменить на S3-compatible storage без переписывания feature logic.

## Пошаговый План Работ

1. Создать monorepo foundation:
   - `pnpm-workspace.yaml`, root `package.json`, root `tsconfig`.
   - `apps/web`, `apps/api`, `packages/shared`, `infra`.
   - Общие команды: `dev`, `build`, `test`, `typecheck`, `lint`.

2. Настроить shared package:
   - Zod-схемы для `User/Profile`, `Client`, `Appointment`, `Attachment`.
   - Общие enum: `profile.status`, `appointment.type`, `appointment.status`.
   - Pure helpers: computed appointment status, salary filters, money formatting.

3. Создать backend foundation:
   - Hono app, config/env validation, `/api/health`.
   - SQLite + Drizzle + migrations.
   - Better Auth email/password.
   - `profiles` со статусами `pending | active | blocked`.
   - Auth guard: рабочие API доступны только `active`.

4. Создать frontend foundation:
   - Vite React app, Tailwind, shadcn/ui, TanStack Router.
   - Auth screens: login/register.
   - Protected layout.
   - Pending account screen.
   - API client, TanStack Query, базовая обработка ошибок.

5. Реализовать core CRUD:
   - Clients: create/edit/archive/list/search.
   - Appointments: create/edit/cancel/list/calendar.
   - Attachments: upload/delete/list только online.
   - Reports: salary and session count by month.

6. Реализовать offline:
   - Dexie schema для clients/appointments/outbox.
   - Local-first UI для clients и appointments.
   - `/api/sync/push` и `/api/sync/pull`.
   - Soft delete, revisions, last-write-wins.
   - Sync status UI: synced, pending, failed.

7. Реализовать production infra:
   - Caddy configs для `app.example.com` и `staging.example.com`.
   - `systemd` services для staging/production.
   - GitHub Actions: build/test/deploy staging on `main`, manual production deploy.
   - Manual backup script/process для SQLite + uploads.
   - Smoke check через `/api/health`.

8. Довести тестовую пирамиду:
   - Backend unit/integration/database tests.
   - Frontend unit/component/integration tests.
   - Playwright e2e for registration, activation, CRUD, offline sync, upload limits.

## Пошаговые Промты Для Реализации

1. Каркас:
   - “Создай monorepo `pnpm` структуру `apps/web`, `apps/api`, `packages/shared`, настрой TypeScript, базовые scripts, Vitest и GitHub Actions для build/test/typecheck. Не реализуй бизнес-логику.”

2. Shared contracts:
   - “На основе документации создай `packages/shared` с Zod-схемами и типами для profiles, clients, appointments, attachments, sync contracts и pure helper-функциями для computed status/salary.”

3. Backend foundation:
   - “Реализуй `apps/api` на Hono: `/api/health`, env validation, Drizzle SQLite setup, migrations, Better Auth email/password, profiles status guard.”

4. Frontend foundation:
   - “Реализуй `apps/web` на React/Vite: routing, Tailwind/shadcn, auth pages, protected layout, pending account screen, API client.”

5. CRUD:
   - “Реализуй clients и appointments CRUD end-to-end через shared schemas, backend routes, frontend screens and tests.”

6. Offline:
   - “Добавь Dexie local DB, outbox, local-first clients/appointments flows и sync endpoints `/api/sync/push`, `/api/sync/pull`.”

7. Фото:
   - “Добавь online-only attachments: frontend compression, backend upload, local filesystem storage, limits 3 files per appointment and 2 MB per file.”

8. Отчеты:
   - “Добавь reports: salary by month and work session count using documented business rules.”

9. Infra:
   - “Добавь `infra` templates для Caddy, systemd, GitHub Actions deploy, env examples and manual backup guide.”

10. Production hardening:
   - “Проведи review тестов, security, error handling, deployment docs, smoke scenarios and fix gaps without changing product scope.”

## Subagents, MCP И Skills

Рекомендация по subagents:

- Использовать subagents не сразу, а с этапа, где есть параллельные независимые задачи.
- Хороший split: один агент backend, один frontend, один tests/QA, один infra/docs.
- Не давать двум агентам один и тот же write scope.
- На первых шагах лучше один основной агент, чтобы архитектура не разъехалась.

Рекомендация по MCP/plugins/skills:

- Browser/Playwright: использовать обязательно для проверки frontend, PWA, responsive UI и e2e flows.
- GitHub connector/plugin: полезен позже для PR, Actions, issues и deploy diagnostics, но не обязателен для старта.
- OpenAI/docs skills не нужны, пока в проекте нет OpenAI API.
- Documents/Spreadsheets/Presentations не нужны для разработки приложения.
- Дополнительные MCP стоит подключать только под конкретную задачу: GitHub, VPS/SSH, мониторинг, дизайн-система.

## Test Plan

Минимум перед production:

- `pnpm typecheck` проходит во всех workspace packages.
- `pnpm test` покрывает shared helpers, backend business rules, API guards, sync logic.
- Playwright e2e покрывает registration -> pending -> manual activation -> login -> CRUD.
- Offline e2e: создать запись offline, восстановить сеть, проверить sync.
- Upload e2e: online upload, лимит размера, лимит количества.
- Deploy smoke: staging `/api/health`, login, CRUD, sync, upload; затем manual production deploy.

## Assumptions

- Проект остается self-hosted на VPS с `Caddy + systemd`.
- Production и staging живут на разных поддоменах.
- Email-сервис не используется: регистрация email/password, ручная активация через SQLite.
- Фото остаются online-only.
- Backup пока ручной, но для зрелого production позже нужен автоматический внешний backup.
- Backend architecture выбирается как modular monolith, потому что это лучший баланс для текущего VPS и будущего масштабирования.
