# Стек

## Цель

Собственное веб-приложение на VPS с легким backend, локальной базой данных, PWA/offline-режимом и контролируемой синхронизацией.

## Зафиксированные решения

| Область | Решение |
| --- | --- |
| Репозиторий | Monorepo |
| Package manager | pnpm |
| Runtime | Node.js LTS |
| Frontend | React + Vite + TypeScript |
| Design system | Figma reference, mobile-first, Tailwind + shadcn/ui |
| PWA/offline на клиенте | IndexedDB через Dexie |
| Backend framework | Hono |
| API style | REST JSON |
| API docs | Scalar on `/api/docs` only in local development |
| Validation | Zod |
| Database | SQLite |
| Database access | Drizzle ORM |
| SQLite driver | better-sqlite3 |
| Migrations | Drizzle Kit |
| Auth | Better Auth |
| Auth method | Email + password |
| Account activation | Manual SQLite status update |
| Email service | Not required |
| Sessions | Secure HTTP-only cookies |
| File storage | Local filesystem |
| Reverse proxy / HTTPS | Caddy |
| Process manager | systemd |
| Deploy | GitHub Actions -> VPS |
| Monitoring | `journalctl` + `/api/health` |
| Testing | Unit, integration, component and e2e tests |

## Планируемая структура

```text
apps/
  web/      # React/Vite PWA
  api/      # Hono backend
packages/
  shared/   # Zod-схемы, типы, API/sync-контракты
docs/       # Архитектурные документы
infra/      # Примеры Caddy/systemd/GitHub Actions
```

## Принципы

- Backend остается собственным API, чтобы не привязывать frontend к конкретной базе или BaaS.
- Frontend работает от локальной IndexedDB и синхронизируется с backend.
- Важные поля сущностей хранятся отдельными колонками, расширяемые поля - в `custom_data`.
- Фото хранятся локально на VPS, но через абстракцию, чтобы позже перейти на S3-compatible storage.
- Сборка проекта выполняется в GitHub Actions, не на VPS.
- Пользователь после регистрации получает статус `pending`; доступ к рабочим данным разрешен только при статусе `active`.
- Offline-запись и редактирование распространяются на клиентов и записи; фото добавляются только online.
