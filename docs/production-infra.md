# Production infra

## VPS setup

Базовый runtime:

```bash
sudo apt update
sudo apt install -y curl rsync sqlite3 caddy
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
corepack enable
```

Пользователь и директории:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin work-planner
sudo useradd --create-home --shell /bin/bash deploy
sudo usermod -aG work-planner deploy
sudo mkdir -p /var/www/work-planner/{staging,production}/{backend/current,frontend,data,backups}
sudo mkdir -p /etc/work-planner
sudo chown -R deploy:work-planner /var/www/work-planner
sudo chmod -R g+rwX /var/www/work-planner
sudo find /var/www/work-planner -type d -exec chmod 2775 {} +
```

## Env files

Скопировать шаблоны:

```bash
sudo install -o root -g work-planner -m 640 infra/env/staging.env.template /etc/work-planner/staging.env
sudo install -o root -g work-planner -m 640 infra/env/production.env.template /etc/work-planner/production.env
```

Заменить:

- `API_BASE_URL`, `WEB_ORIGIN`;
- `AUTH_SECRET`;
- домены в `infra/caddy/Caddyfile`.

Production и staging должны иметь разные `DATABASE_PATH`, `AUTH_SECRET` и origin.

## systemd and Caddy

```bash
sudo cp infra/systemd/work-planner-*.service /etc/systemd/system/
sudo cp infra/caddy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl daemon-reload
sudo systemctl enable work-planner-staging work-planner-production
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Для GitHub Actions deploy user должен иметь SSH-доступ и право на рестарт сервисов:

```text
deploy ALL=(root) NOPASSWD: /bin/systemctl restart work-planner-staging, /bin/systemctl restart work-planner-production
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

Variables:

```text
STAGING_API_BASE_URL=https://staging.example.com
PRODUCTION_API_BASE_URL=https://app.example.com
```

## Deploy flow

Staging:

```text
push в main -> CI -> deploy-staging workflow
```

Production:

```text
GitHub Actions -> Deploy Production -> Run workflow
```

Workflow делает:

1. `pnpm install --frozen-lockfile`.
2. `pnpm run ci`, где уже выполняется `pnpm build`.
3. Upload `apps/web/dist` и backend release на VPS.
4. На VPS: `pnpm install --frozen-lockfile`.
5. На VPS: `DATABASE_PATH=/var/www/work-planner/<env>/data/app.sqlite pnpm db:migrate`.
6. `sudo systemctl restart work-planner-<env>`.
7. `curl -fsS http://127.0.0.1:<port>/api/health`.

Сборка на VPS не выполняется.
SQLite-файлы после миграций остаются group-writable для `work-planner`.

## First deploy checklist

До первого deploy:

```bash
sudo -u work-planner mkdir -p /var/www/work-planner/staging/data /var/www/work-planner/production/data
```

После первого upload, если база пустая:

```bash
cd /var/www/work-planner/staging/backend/current
DATABASE_PATH=/var/www/work-planner/staging/data/app.sqlite pnpm db:setup
```

Повторить для production только после успешного staging smoke test.

## Smoke checks

Для staging и production:

- `GET /api/health` возвращает `ok: true` и правильный `environment`;
- регистрация и login работают;
- новый пользователь получает ожидаемый pending/active flow;
- CRUD клиентов работает;
- CRUD записей работает;
- offline изменения синхронизируются после восстановления сети;
- `journalctl -u work-planner-<env> -n 100` без новых ошибок.
