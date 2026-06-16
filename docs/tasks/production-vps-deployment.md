# Production VPS Deployment

## Problem

Production deploy описан в документации, но flow нужно довести до полностью проверенного рабочего состояния.

## Desired Behavior

Staging и production деплоятся по описанному VPS flow: GitHub Actions собирает проект, копирует артефакты, применяет миграции и перезапускает systemd service.

## Current Context

Основные документы: `docs/deployment.md`, `docs/10-production-infra.md`, `docs/environments.md`.

## Plan

- Проверить актуальность infra-шаблонов Caddy, systemd, env и GitHub Actions.
- Настроить VPS-директории, env-файлы, deploy user и systemd services.
- Прогнать staging deploy.
- После staging smoke checks выполнить production deploy.
- Зафиксировать найденные отличия в документации.

## Tests

- `pnpm ci` проходит до deploy.
- `GET /api/health` возвращает корректный environment.
- Login, clients CRUD, appointments CRUD и sync smoke проходят на staging.

## Risks

- Можно применить миграции не к тому окружению.
- Можно смешать staging и production env/secrets.

## Result

Заполнить после реализации.
