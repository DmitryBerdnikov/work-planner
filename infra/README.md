# Production infra templates

Шаблоны рассчитаны на один VPS с двумя окружениями:

```text
/var/www/work-planner/
  staging/
    backend/current/
    frontend/
    data/app.sqlite
    backups/
  production/
    backend/current/
    frontend/
    data/app.sqlite
    backups/
```

Сервисы:

```text
work-planner-staging.service
work-planner-production.service
```

Домены-заглушки:

```text
staging.example.com
app.example.com
```

Перед применением заменить домены, email, `AUTH_SECRET` и GitHub secrets/vars на реальные значения.

