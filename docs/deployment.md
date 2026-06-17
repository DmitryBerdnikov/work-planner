# Деплой на VPS

## Сервер

Текущий VPS:

```text
CPU: 1
RAM: 512 MB
SSD: 10 GB
```

Docker пробуем на текущем VPS. Если не хватает RAM или disk, перейти минимум на `1 GB RAM / 20 GB SSD`.

## Runtime на VPS

Нужно установить:

- Docker Engine с Docker Compose plugin;
- Caddy;
- отдельного `deploy` user с SSH-доступом и правом запускать Docker;
- SQLite хранится как файл на host filesystem.

Node.js и pnpm на VPS для runtime больше не нужны. Сборка выполняется в GitHub Actions.

## Схема

```text
Caddy на host
  |-- /api/* -> backend container
  |-- /*      -> frontend Nginx container

Docker Compose
  |-- API image: Hono + Node runtime
  |-- Web image: Nginx + Vite dist

SQLite
  |-- /var/www/work-planner/<env>/data/app.sqlite
```

## Пути

```text
/var/www/work-planner/
  staging/
    docker-compose.yml
    data/app.sqlite
    backups/
  production/
    docker-compose.yml
    data/app.sqlite
    backups/
```

`uploads/` добавляется позже, когда post-deploy этап реализует attachments.

## GitHub Actions

Staging и production используют отдельные workflows:

1. Установить Node.js и pnpm на runner.
2. Выполнить `pnpm install --frozen-lockfile`.
3. Выполнить `pnpm run ci`.
4. Собрать Docker images для API и web.
5. Опубликовать images в GHCR.
6. Подключиться к VPS по SSH.
7. Обновить `docker-compose.yml` выбранного окружения.
8. Выполнить `docker compose pull`.
9. Применить migrations через API image.
10. Выполнить `docker compose up -d --remove-orphans`.
11. Проверить `GET /api/health`.

Staging запускается по push в `main`. Production запускается вручную через `workflow_dispatch`.

## Caddy

Caddy отвечает за:

- HTTPS;
- домены staging/production;
- reverse proxy `/api/*` на backend container;
- reverse proxy frontend traffic на web container;
- лимит размера request body, когда появятся attachments.

Порты на host:

```text
staging API:      127.0.0.1:3001
staging web:      127.0.0.1:8081
production API:   127.0.0.1:3000
production web:   127.0.0.1:8080
```

## Data isolation

Staging и production не должны использовать одну SQLite-базу или один auth secret.

```text
/var/www/work-planner/staging/data/app.sqlite
/var/www/work-planner/production/data/app.sqlite
```

В compose container видит базу как `/data/app.sqlite`, но host backup scripts работают с `/var/www/work-planner/<env>/data/app.sqlite`.

## Backups

Backup выполняется вручную через `infra/scripts/backup-sqlite.sh` и `sqlite3 .backup`.

В архив входят:

- SQLite database;
- manifest;
- env-файл, если процесс может его прочитать.

Backup нельзя хранить только на этом же VPS.

## Monitoring

Минимальный мониторинг:

- `docker compose logs api --tail=100`;
- `docker compose ps`;
- `curl -fsS https://<domain>/api/health`;
- host resources: `df -h`, `free -m`, `docker system df`.

Минимальный healthcheck:

```json
{
  "ok": true,
  "environment": "production",
  "version": "..."
}
```
