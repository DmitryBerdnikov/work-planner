# Production infra templates

Шаблоны рассчитаны на один VPS с двумя окружениями:

```text
/var/www/work-planner/
  staging/
    docker-compose.yml
    backup-sqlite.sh
    data/app.sqlite
    backups/
  production/
    docker-compose.yml
    backup-sqlite.sh
    data/app.sqlite
    backups/
```

Runtime:

```text
Caddy on host
Docker Compose per environment
SQLite file on host volume
GHCR images built by GitHub Actions
```

Домены-заглушки:

```text
staging.example.com
app.example.com
```

Перед применением заменить домены, email, `AUTH_SECRET`, GHCR pull secrets и GitHub deploy secrets на реальные значения.

`infra/systemd/` оставлен как legacy reference для rollback во время перехода, но основной deploy использует Docker Compose.
