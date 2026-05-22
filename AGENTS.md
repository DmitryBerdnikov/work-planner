# Work Planner — notes for AI agents

## Where to look

- **Business rules & tests:** [docs/06-rules-and-testing.md](docs/06-rules-and-testing.md)
- **Data model:** [docs/02-data-model.md](docs/02-data-model.md)
- **Code style:**
  - [general.md](docs/code-style/general.md) — TypeScript, shared
  - [backend.md](docs/code-style/backend/backend.md) — `apps/api`
  - [frontend.md](docs/code-style/frontend/frontend.md) — `apps/web` (Vite, Router, Query)
  - [react.md](docs/code-style/frontend/react.md) — components, hooks, UI tests
- **Commits:** [docs/09-commit-conventions.md](docs/09-commit-conventions.md) — `chore`, `bugfix`, `feature`
- **Architecture plan:** [PLAN.md](PLAN.md)

## Monorepo

| Path | Role |
| --- | --- |
| `apps/web` | React + Vite + TanStack Router/Query |
| `apps/api` | Hono + Drizzle + Better Auth |
| `packages/shared` | Zod schemas, pure helpers (no DB) |

## Defaults

- Commit messages: `chore:`, `bugfix:`, or `feature:` per [09-commit-conventions.md](docs/09-commit-conventions.md).
- Match existing patterns in `apps/web/src` before adding new abstractions.
- Minimize diff scope; reuse `packages/shared` for contracts and business rules.

## Local Dev Servers

- Treat local dev servers as long-lived session processes.
- At the start of browser/API verification, first check whether the expected servers are already available:
  - frontend: `http://127.0.0.1:5173`
  - API: `http://127.0.0.1:3000`
- If a required server is already running, reuse it instead of starting another process.
- If a required server is not running, start it with the normal dev command:
  - frontend: `pnpm --filter @work-planner/web dev`
  - API: `pnpm --filter @work-planner/api dev`
- Do not stop standard dev servers after verification unless the user explicitly asks.
- Do not start duplicate Vite/API processes on fallback ports like `5174` or `5175` without first checking the standard URL.
- If a port is busy, inspect the existing server with browser/health checks before starting a replacement.
