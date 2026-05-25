# Соглашение по коммитам

## Префиксы

Каждое сообщение коммита начинается с одного из префиксов:

| Префикс | Когда использовать |
| --- | --- |
| `chore` | Инфраструктура, tooling, CI, зависимости, конфиги, документация без изменения поведения приложения |
| `fix` | Исправление бага в существующей функциональности |
| `feat` | Новая функциональность или заметное расширение поведения для пользователя |

Другие префиксы (`refactor`, `test`, `docs` и т.п.) в этом проекте **не используем** — выбирай ближайший из трёх (например, тесты к фиче — в коммите `feat`, правка CI — `chore`).

## Формат

```text
<prefix>: <краткое описание>
```

- После префикса — двоеточие и пробел.
- Описание на **английском**, в **настоящем времени**, без точки в конце.
- До ~72 символов в первой строке.
- Тело коммита (опционально) — что и зачем, если неочевидно из diff.

## Примеры

```text
chore: add GitHub Actions CI workflow
chore: update eslint consistent-type-definitions rule
fix: return 403 when profile is not active
feat: add clients list page with search
feat: implement appointment create form
```

## Scope (опционально)

Если затронут один пакет, можно уточнить:

```text
feat(web): add dashboard health status card
fix(api): fix CORS credentials for auth cookies
chore: bump vitest in root workspace
```

Scope: `web`, `api`, `shared` — по папкам monorepo.

## Не делать

- `fix:`, `feat:`, `Fix bug` без префикса из таблицы.
- Слишком общие сообщения: `update`, `wip`, `changes`.
- Один коммит с несвязанными `feat` + `chore` — лучше разделить.
