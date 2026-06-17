# Production VPS Deployment

## Problem

Текущий deploy через `rsync` всего репозитория и systemd нужно заменить на Docker-based deploy.

Причина перехода: текущий flow начал передавать `node_modules` на VPS, из-за чего staging deploy стал тяжелым и хрупким.

Последние проверенные попытки staging deploy:

- `Deploy Staging` run `26456755431`, commit `6a92142`, `2026-05-26` - failure на шаге `Upload backend release`.
- До этого успешно прошли `pnpm install`, `pnpm run ci`, проверка deploy config, SSH setup и создание remote-директорий.
- `Upload frontend` и `Migrate and restart` были skipped из-за падения backend upload.
- Предыдущая попытка staging deploy, run `26455778797`, commit `cee90eb`, дошла до `Migrate and restart`, но упала на этом шаге.
- Production workflow пока не запускался.

## Desired Behavior

Staging и production деплоятся через Docker.

Целевая схема:

- frontend работает в Docker container с Nginx и собранным Vite `dist`;
- backend работает в Docker container с Node API и production runtime;
- Caddy остается на host и отвечает за HTTPS, домены и reverse proxy;
- SQLite database остается вне контейнеров на host filesystem;
- staging и production используют разные compose/env/volume директории;
- Docker images собираются в GitHub Actions и публикуются в registry;
- VPS только скачивает images, применяет миграции, перезапускает containers и проходит healthcheck.

Финальный результат задачи - приложение успешно задеплоено на VPS через Docker: сначала staging с smoke checks, затем production с production smoke checks.

## Current Context

Основные документы: `docs/deployment.md`, `docs/production-infra.md`, `docs/environments.md`.

Текущий VPS:

- `512 MB RAM`;
- `10 GB SSD`;
- текущие ресурсы пробуем использовать как есть;
- если Docker runtime или images не помещаются по RAM/disk, нужен новый VPS.

Рекомендуемые ресурсы для нормального Docker production:

- минимум: `1 vCPU`, `1 GB RAM`, `20 GB SSD`;
- комфортно: `2 vCPU`, `2 GB RAM`, `30-40 GB SSD`.

Целевая связь сервисов:

- `https://staging.../` -> Caddy -> frontend container;
- `https://staging.../api/*` -> Caddy -> backend container;
- `https://app.../` -> Caddy -> frontend container;
- `https://app.../api/*` -> Caddy -> backend container.

SQLite оставляем на текущем этапе. PostgreSQL не нужен для первого Docker deploy: проект сейчас рассчитан на один backend instance и небольшой VPS. База должна храниться на host volume, например:

- `/var/www/work-planner/staging/data/app.sqlite`;
- `/var/www/work-planner/production/data/app.sqlite`.

## Plan

- Реализовать локальный Docker flow для frontend, backend и SQLite volume.
- Проверить локально `docker compose up --build`.
- Проверить локально `GET /api/health`, login, clients CRUD, appointments CRUD и sync smoke.
- Добавить production Docker images: frontend image и backend image.
- Настроить GitHub Actions build/push images в registry.
- Настроить VPS Docker Compose для staging.
- Подключить Caddy на host к staging containers.
- Применить staging migrations через Docker command.
- Прогнать staging deploy через Docker.
- Зафиксировать результат staging deploy: run URL, commit, упавший или успешный шаг, вывод healthcheck.
- Если текущий VPS не хватает по RAM/disk, зафиксировать причину и перейти на новый VPS.
- Настроить VPS Docker Compose для production.
- После staging smoke checks выполнить production deploy.
- Зафиксировать результат production deploy: run URL, commit, вывод healthcheck.
- Зафиксировать найденные отличия в документации и итоговый статус задачи.

## Tests

- `pnpm ci` проходит до deploy.
- Локальный Docker compose поднимает frontend и backend.
- Локально `GET /api/health` отвечает через backend container.
- Локально frontend открывается и ходит в backend container.
- Staging `GET /api/health` возвращает корректный environment.
- Login, clients CRUD, appointments CRUD и sync smoke проходят на staging после Docker deploy.
- После production deploy `GET /api/health` возвращает `environment: "production"`.
- Production smoke check проходит без смешивания staging и production данных.

## Risks

- Можно применить миграции не к тому окружению.
- Можно смешать staging и production env/secrets.
- Текущего VPS может не хватить для Docker по RAM или disk.
- Docker images/layers могут быстро занять `10 GB SSD`.
- SQLite file должен быть на host volume, иначе данные можно потерять при пересоздании container.
- Нужно не смешать staging и production volumes.

## Result

2026-06-17: локальная Docker-реализация завершена и проверена.

Сделано:

- Добавлен Docker-based runtime для API и web:
  - `Dockerfile.api`;
  - `Dockerfile.web`;
  - `compose.yml`;
  - `infra/docker/compose.staging.yml`;
  - `infra/docker/compose.production.yml`;
  - `infra/nginx/web.conf`.
- GitHub Actions staging/production переведены с `rsync` + systemd на build/push Docker images в GHCR и deploy через `docker compose` на VPS.
- Caddy template переведен на reverse proxy в frontend/backend containers.
- API переведен на Node ESM-compatible TypeScript config:
  - `module: "NodeNext"`;
  - `moduleResolution: "NodeNext"`;
  - relative imports используют `.js` suffix.
- Добавлен `API_HOST`, чтобы local dev мог оставаться на `127.0.0.1`, а container runtime слушал `0.0.0.0`.
- Добавлен production migration entrypoint `apps/api/src/db/migrate.ts`.
- Migration entrypoint применяет:
  - Better Auth tables: `user`, `session`, `account`, `verification`;
  - app/Drizzle tables: `profiles`, `clients`, `appointments`, `attachments`.
- Документация обновлена под Docker Compose deploy:
  - `docs/deployment.md`;
  - `docs/production-infra.md`;
  - `docs/environments.md`;
  - `docs/backups.md`;
  - `infra/README.md`;
  - `docs/adr.md`.

Локально проверено:

- `pnpm run ci` проходит.
- `node apps/api/dist/db/migrate.js` на чистой SQLite базе создает auth + app tables.
- `docker compose up --build -d` поднимает API и web.
- `GET http://127.0.0.1:3000/api/health` отвечает.
- Регистрация нового пользователя проходит без `no such table: user`.
- Пользователь активируется вручную через SQLite update в container.
- Local smoke на чистой backend базе проверен.

Важные заметки для следующего агента:

- Если после удаления `.data/docker/app.sqlite` в UI видны старые клиенты/записи, это не backend database, а browser IndexedDB/PWA cache на origin `http://127.0.0.1:8080`. Для чистой проверки нужно очистить browser site data, IndexedDB `work-planner` и service worker.
- Для локальной активации пользователя:

```bash
docker compose exec api node -e 'const Database = require("better-sqlite3"); const db = new Database("/data/app.sqlite"); db.prepare("update profiles set status = '\''active'\'', activated_at = datetime('\''now'\''), updated_at = datetime('\''now'\'') where email = ?").run("<email>"); console.log(db.prepare("select email, status, activated_at from profiles").all());'
```

- `Dockerfile.api` currently copies full workspace `node_modules` from the deps stage into runtime. This unblocks deploy but makes the API image larger. A later optimization can switch to a smaller production dependency layout.
- Do not archive this task yet: staging and production VPS deploys are still pending.

Next rollout steps:

1. Ensure GitHub secrets are set:
   - `GHCR_READ_USERNAME`;
   - `GHCR_READ_TOKEN`;
   - existing staging/production deploy SSH secrets.
2. Prepare VPS:
   - install Docker Engine + Compose plugin;
   - ensure `deploy` user can run Docker;
   - create `/var/www/work-planner/staging/{data,backups}`;
   - create `/var/www/work-planner/production/{data,backups}`;
   - update `/etc/work-planner/staging.env`;
   - update `/etc/work-planner/production.env`;
   - apply updated Caddyfile.
3. Push current branch/main and run staging workflow.
4. On VPS staging, verify:

```bash
cd /var/www/work-planner/staging
docker compose ps
docker compose logs api --tail=100
curl -fsS http://127.0.0.1:3001/api/health
```

5. Run staging smoke:
   - registration/login;
   - profile activation if needed;
   - clients CRUD;
   - appointments CRUD;
   - sync smoke;
   - ensure no staging/production data mixing.
6. Record staging run URL, commit, result, and healthcheck output in this task file.
7. Only after staging passes, run manual production workflow and repeat production smoke.
8. Record production run URL, commit, result, and healthcheck output in this task file.

Журнал попыток:

| Date | Environment | Commit | Run | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| 2026-05-26 | staging | `cee90eb` | `26455778797` | failed | Backend и frontend upload прошли, failure на `Migrate and restart`. |
| 2026-05-26 | staging | `6a92142` | `26456755431` | failed | Failure на `Upload backend release`; frontend upload, migrations и restart не запускались. |
| 2026-06-17 | local Docker | pending commit | local | passed | Docker compose, healthcheck, registration, Better Auth migrations and clean backend database flow tested locally. |
