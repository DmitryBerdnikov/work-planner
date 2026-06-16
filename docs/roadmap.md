# Roadmap

Актуальный рабочий план развития проекта. Детали каждой задачи лежат в `docs/tasks/`.

## Current baseline

Work Planner собран как monorepo: `apps/web` на React/Vite, `apps/api` на Hono, `packages/shared` для Zod-схем и pure helpers. Backend использует SQLite + Drizzle + Better Auth, frontend работает local-first через Dexie/outbox и синхронизацию с API.

Production-направление зафиксировано как VPS deploy через Caddy, systemd, SQLite-файл и GitHub Actions. Детали лежат в [deployment.md](deployment.md), [10-production-infra.md](10-production-infra.md) и [11-backups.md](11-backups.md).

## Planned improvements

| Priority | Area       | Task                                                                 |
| -------- | ---------- | -------------------------------------------------------------------- |
| P1       | Deploy     | [Production VPS Deployment](tasks/production-vps-deployment.md)       |
| P1       | Backup     | [SQLite Backup Hardening](tasks/sqlite-backup-hardening.md)           |
| P1       | Testing    | [E2E Smoke Coverage](tasks/e2e-smoke-coverage.md)                     |
| P2       | Attachments | [Post-Deploy Attachments](tasks/post-deploy-attachments.md)           |
| P2       | Analytics  | [Analytics Reports](tasks/analytics-reports.md)                       |

## Completed

Завершенные task-файлы переносятся в [archive/](archive/) с заполненным `Result`.

## Правила обновления

- Обновлять здесь только приоритет, область и ссылку на задачу.
- Не хранить длинные планы в roadmap.
- Детали активных задач хранить в `docs/tasks/`.
- После завершения задачи заполнить `Result` и перенести task-файл в `docs/archive/`.
