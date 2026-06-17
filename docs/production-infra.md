# Production infra

## VPS setup

Базовый runtime:

```bash
sudo apt update
sudo apt install -y ca-certificates curl sqlite3 caddy
curl -fsSL https://get.docker.com | sudo sh
```

Пользователь и директории:

```bash
sudo useradd --create-home --shell /bin/bash deploy
sudo usermod -aG docker deploy
sudo mkdir -p /var/www/work-planner/{staging,production}/{data,backups}
sudo mkdir -p /etc/work-planner
sudo chown -R deploy:deploy /var/www/work-planner
sudo chmod -R u+rwX,g+rwX /var/www/work-planner
```

После добавления `deploy` в группу `docker` нужно перелогиниться по SSH.

## Env files

Скопировать шаблоны:

```bash
sudo install -o root -g deploy -m 640 infra/env/staging.env.template /etc/work-planner/staging.env
sudo install -o root -g deploy -m 640 infra/env/production.env.template /etc/work-planner/production.env
```

Заменить:

- `API_BASE_URL`, `WEB_ORIGIN`;
- `AUTH_SECRET`;
- домены и email в `infra/caddy/Caddyfile`.

Production и staging должны иметь разные `DATABASE_PATH`, `AUTH_SECRET` и origin.

## Caddy

```bash
sudo cp infra/caddy/Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy проксирует:

```text
staging.example.com/api/* -> 127.0.0.1:3001
staging.example.com/*     -> 127.0.0.1:8081
app.example.com/api/*     -> 127.0.0.1:3000
app.example.com/*         -> 127.0.0.1:8080
```

## GitHub settings

Environments:

```text
staging
production
```

Secrets для staging:

```text
STAGING_DEPLOY_HOST
STAGING_DEPLOY_USER
STAGING_DEPLOY_SSH_KEY
STAGING_DEPLOY_PORT
```

Secrets для production:

```text
PRODUCTION_DEPLOY_HOST
PRODUCTION_DEPLOY_USER
PRODUCTION_DEPLOY_SSH_KEY
PRODUCTION_DEPLOY_PORT
```

Shared GHCR pull secrets:

```text
GHCR_READ_USERNAME
GHCR_READ_TOKEN
```

`GHCR_READ_TOKEN` должен иметь право читать packages из GHCR. Workflows публикуют images через `GITHUB_TOKEN`.

## Deploy flow

Staging:

```text
push в main -> CI -> build/push Docker images -> VPS docker compose deploy
```

Production:

```text
GitHub Actions -> Deploy Production -> Run workflow
```

Workflow делает:

1. `pnpm install --frozen-lockfile`.
2. `pnpm run ci`.
3. Build/push API и web images в GHCR.
4. Upload compose-файла в `/var/www/work-planner/<env>/docker-compose.yml`.
5. На VPS: `docker login ghcr.io`.
6. На VPS: `docker compose pull`.
7. На VPS: `docker compose run --rm api node dist/db/migrate.js`.
8. На VPS: `docker compose up -d --remove-orphans`.
9. `curl -fsS http://127.0.0.1:<port>/api/health`.

## Local Docker check

```bash
docker compose up --build
curl -fsS http://127.0.0.1:3000/api/health
open http://127.0.0.1:8080
```

Local compose runs migrations before starting the API container.

## First deploy checklist

До первого deploy:

```bash
sudo -u deploy mkdir -p /var/www/work-planner/staging/data /var/www/work-planner/production/data
sudo -u deploy mkdir -p /var/www/work-planner/staging/backups /var/www/work-planner/production/backups
```

После staging deploy:

```bash
cd /var/www/work-planner/staging
docker compose ps
curl -fsS http://127.0.0.1:3001/api/health
docker compose logs api --tail=100
```

Production deploy запускать только после успешного staging smoke check.

## Smoke checks

Для staging и production:

- `GET /api/health` возвращает `ok: true` и правильный `environment`;
- регистрация и login работают;
- новый пользователь получает ожидаемый pending/active flow;
- CRUD клиентов работает;
- CRUD записей работает;
- offline изменения синхронизируются после восстановления сети;
- `docker compose logs api --tail=100` без новых ошибок;
- `docker system df`, `df -h`, `free -m` показывают достаточный запас.
