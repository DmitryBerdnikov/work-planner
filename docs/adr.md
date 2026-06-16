# ADR

Короткий список устойчивых технических решений. Детали и обоснования остаются в тематических документах из `docs/`.

2026-05-22

- Work Planner ведется как pnpm monorepo: `apps/web`, `apps/api`, `packages/shared`.
- Shared package содержит Zod-схемы, типы и pure helpers без доступа к БД.
- Frontend: React + Vite + TypeScript, TanStack Router/Query, Tailwind, Dexie.
- Backend: Hono, Drizzle ORM, Better Auth, SQLite через `better-sqlite3`.

2026-05-26

- Production deploy ориентирован на VPS, Caddy, systemd и SQLite-файл.
- Сборка выполняется в GitHub Actions, а не на VPS.
- Staging и production используют разные `DATABASE_PATH`, `AUTH_SECRET` и origin.
- Backend healthcheck доступен на `GET /api/health`.

2026-06-16

- `docs/roadmap.md` = source of truth для текущего плана работ.
- Детали активных задач хранятся в `docs/tasks/`, чтобы roadmap оставался коротким.
- Завершенные задачи архивируются в `docs/archive/` с заполненным `Result`.
- `docs/README.md` является основной точкой входа в документацию.
