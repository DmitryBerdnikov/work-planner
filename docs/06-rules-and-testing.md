# Правила и тестирование

## Бизнес-правила

- Запись может быть без клиента.
- У записи есть обязательный `title`.
- У записи есть `type`: `work` или `personal`.
- В базе хранится `status`: `scheduled` или `cancelled`.
- Статус `completed` вычисляется по `starts_at <= now`, без cron/job.
- Зарплата считается как сумма `session_amount` для `work` записей, которые не отменены и уже прошли.
- `prepayment_amount` не уменьшает зарплату и используется только для расчета суммы к доплате в UI.
- Сумма к доплате не хранится в базе.

## Фото

- До 3 фото на запись.
- До 2 MB на фото после сжатия.
- Сжатие выполняется на frontend перед upload.
- Фото хранятся локально на VPS.
- Добавление и редактирование фото доступно только online.

## Offline

- Offline можно создавать и редактировать клиентов.
- Offline можно создавать, редактировать и отменять записи.
- Offline нельзя добавлять или редактировать фото.
- Синхронизация выполняется через local outbox и `/api/sync/push`, `/api/sync/pull`.

## Backup

- Backup выполняется вручную.
- Архив должен включать SQLite database, uploads и конфигурацию деплоя.
- Архив должен скачиваться и храниться вне VPS.
- Для зрелого production нужен автоматический внешний backup.

## Monitoring

- Логи backend смотрятся через `journalctl`.
- Backend предоставляет `GET /api/health`.
- Healthcheck возвращает `ok`, `environment` и `version`.

## Тестовая пирамида

Тестирование закладывается сразу, не откладывается на поздний этап.

Backend:

- unit tests для бизнес-правил: деньги, computed status, доступ по `active` status;
- integration tests для Hono routes, auth guard, CRUD и sync API;
- database tests для Drizzle schema, migrations и SQLite constraints.

Frontend:

- unit tests для чистой логики: форматирование денег, computed status, фильтры статистики;
- component tests для форм, календарных карточек, списков клиентов и записей;
- integration tests для offline IndexedDB/Dexie flows и outbox;
- e2e tests для критических пользовательских сценариев.

E2E smoke scenarios:

- регистрация -> `pending` -> запрет доступа к рабочим данным;
- manual activation -> login -> доступ к приложению;
- создание клиента и записи;
- запись без клиента с `type = personal`;
- прошедшая `work` запись попадает в зарплату;
- `cancelled` запись не попадает в зарплату;
- offline создание записи -> online sync;
- online upload фото с проверкой лимитов.

