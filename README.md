# Work Planner

Web application for logging work sessions: clients, appointments, amounts, notes, photos, calendar, reports, and offline-first functionality with subsequent synchronization.

## Tech Stack

| Area | Decision |
|--------|----------|
| Repository | Monorepo |
| Package Manager | pnpm |
| Runtime | Docker containers, Node.js LTS inside API image |
| Frontend | React + Vite + TypeScript |
| Design System | Figma reference, mobile-first, Tailwind CSS + shadcn/ui |
| Client-side PWA / Offline Storage | IndexedDB via Dexie |
| Backend Framework | Hono |
| API Style | REST JSON |
| API Documentation | Scalar on `/api/docs` (local development only) |
| Validation | Zod |
| Database | SQLite |
| Database Access | Drizzle ORM |
| SQLite Driver | better-sqlite3 |
| Migrations | Drizzle Kit |
| Authentication | Better Auth |
| Authentication Method | Email + Password |
| Account Activation | Manual SQLite status update |
| Email Service | Not required |
| Sessions | Secure HTTP-only cookies |
| File Storage | Local filesystem (planned post-deployment for attachments) |
| Reverse Proxy / HTTPS | Caddy |
| Process Manager | Docker Compose |
| Deployment | GitHub Actions → GHCR → VPS Docker Compose |
| Monitoring | `docker compose logs` + `/api/health` |
| Testing | Unit, integration, component, and E2E tests |


## Architecture

```text
apps/
  web/      # React/Vite PWA frontend
  api/      # Hono backend API

packages/
  shared/   # Zod schemas, shared types, API and sync contracts

docs/       # Architecture and technical documentation

infra/      # Caddy, Docker Compose, Nginx, env, and maintenance templates
```

## Commands

- Install: `pnpm install`
- Development: `pnpm dev`
- Build: `pnpm build`


## Documentation

- [Data model](docs/data-model.md)
- [Offline sync](docs/offline-sync.md)
- [Deployment](docs/deployment.md)
- [Environments staging/production](docs/environments.md)
- [Rules and testing](docs/rules-and-testing.md)
- [Design System](docs/design-system.md)
- [Code style Frontend](docs/code-style/frontend/frontend.md)
- [Code style Backend](docs/code-style/backend/backend.md)
- [Roadmap](docs/roadmap.md) — current workstreams and links to related tasks.
- [Tasks](docs/tasks/) — detailed plans for individual active tasks.
- [ADR](docs/adr.md) — a concise list of established architectural and technical decisions.
- [Archive](docs/archive/) — completed tasks and archived plans.
- [Workflow](docs/workflow.md) — the task lifecycle process, from planning to deployment.
