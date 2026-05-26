# Деплой на VPS

## Сервер

Целевой VPS:

```text
OS: Linux
CPU: 1
RAM: 512 MB
SSD: 10 GB
IP: 1
```

Под этот сервер выбран легкий self-hosted стек без Supabase, PostgreSQL, Docker Compose и тяжелых BaaS-компонентов.

## Runtime на VPS

Нужно установить:

- Node.js LTS;
- Caddy;
- systemd используется из ОС;
- SQLite как библиотека/файл через backend;
- отдельного пользователя для приложения.

## Схема

```text
Caddy
  |-- static frontend
  |-- /api/* -> Hono backend

systemd
  |-- Node.js backend service

backend
  |-- SQLite database file
```

## Пути

Ориентировочная структура для одного окружения:

```text
/var/www/work-planner/
  production/
    frontend/
    backend/
    data/
      app.sqlite
    backups/
  staging/
    frontend/
    backend/
    data/
      app.sqlite
    backups/
```

`uploads/` добавляется позже, когда post-deploy этап реализует attachments.

## GitHub Actions

Деплой выполняется через GitHub Actions отдельно для staging и production:

1. Установить Node.js LTS и pnpm.
2. Установить зависимости.
3. Запустить проверки.
4. Собрать frontend и backend.
5. Выбрать окружение деплоя.
6. Скопировать артефакты на VPS по SSH.
7. Применить миграции к базе выбранного окружения.
8. Перезапустить соответствующий systemd-сервис.

Сборка не должна выполняться на VPS.

Staging и production не должны использовать одну SQLite-базу или один auth secret. После реализации attachments у окружений также должны быть разные папки uploads.

## Caddy

Caddy отвечает за:

- HTTPS;
- отдачу frontend-статики;
- reverse proxy `/api/*` на backend;
- лимит размера request body, когда появятся attachments.

## systemd

systemd отвечает за:

- запуск backend после перезагрузки сервера;
- перезапуск при падении;
- логи через `journalctl`;
- запуск от отдельного пользователя.

Для staging и production используются разные сервисы:

```text
work-planner-staging.service
work-planner-production.service
```

## Backups

Backup выполняется вручную:

1. Создать корректный архив SQLite database.
2. Скачать архив с VPS.
3. Хранить копию вне VPS.

В архив входят:

- SQLite database;
- конфигурация деплоя.

После реализации attachments backup также должен включать uploads.

Backup нельзя хранить только на этом же VPS. Для зрелого production нужно перейти на автоматический внешний backup.

Для SQLite нужно использовать корректный backup-подход, а не простое копирование файла во время активной записи.

## Monitoring

Мониторинг:

- backend-логи через `journalctl`;
- healthcheck endpoint `GET /api/health`.

Минимальный ответ healthcheck:

```json
{
  "ok": true,
  "environment": "production",
  "version": "..."
}
```
