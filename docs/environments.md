# Окружения staging/production

## Цель

Нужно иметь две версии приложения:

- `staging` - тестирование перед релизом;
- `production` - рабочая версия с реальными данными.

Окружения должны быть изолированы по данным, файлам, секретам и процессам.

## Рекомендованная схема

На старте допустимо держать оба окружения на одном VPS, если проект остается легким по нагрузке.

```text
staging.example.com
  -> Caddy
  -> Docker Compose staging containers
  -> /var/www/work-planner/staging/data/app.sqlite

example.com
  -> Caddy
  -> Docker Compose production containers
  -> /var/www/work-planner/production/data/app.sqlite
```

Если появится нагрузка или требования к надежности, production лучше вынести на отдельный VPS.

## Домены

Зафиксированный вариант:

```text
app.example.com       # production
staging.example.com   # staging
```

Можно использовать один домен и разные поддомены. Не стоит использовать разные URL-пути вроде `/staging`, потому что cookies, PWA cache и service worker проще безопасно разделять по поддоменам.

## Порты

Backend containers публикуются на разные localhost-порты host:

```text
production API: 127.0.0.1:3000
staging API:    127.0.0.1:3001
```

Caddy проксирует запросы на нужный сервис по домену.

Frontend containers публикуются отдельно:

```text
production web: 127.0.0.1:8080
staging web:    127.0.0.1:8081
```

## Данные

У каждого окружения свои:

- SQLite database;
- backups;
- auth secret;
- cookie name;
- app URL;
- CORS/trusted origins;
- env-файл.

Нельзя подключать staging к production-базе.

## GitHub Actions

Зафиксированная политика:

```text
push в main       -> deploy staging
manual approval   -> deploy production
```

Production-деплой лучше делать вручную через GitHub Actions `workflow_dispatch`, чтобы случайный push не обновлял рабочую версию.

Позже можно перейти на:

```text
push в develop    -> deploy staging
tag v*            -> deploy production
```

## Миграции

Миграции применяются сначала на staging. Если staging работает корректно, те же миграции применяются на production.

Порядок:

1. Deploy staging.
2. Apply staging migrations.
3. Проверить login, CRUD и sync.
4. Deploy production.
5. Apply production migrations.
6. Проверить production smoke-test.

## PWA и offline

Staging и production должны иметь разные origin:

```text
https://staging.example.com
https://app.example.com
```

Это важно, потому что PWA cache, IndexedDB, cookies и service worker привязаны к origin. Разные поддомены защищают production-данные от смешивания со staging.

## Ограничение текущего VPS

На `512 MB RAM` оба окружения допустимы только при аккуратной настройке:

- не запускать сборку на VPS;
- держать по одному Node-процессу на окружение;
- следить за RAM и диском;
- делать внешние backups.

Если сервер начнет упираться в память или диск, первым кандидатом на вынос должен быть staging или файловое хранилище.
