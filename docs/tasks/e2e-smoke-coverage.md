# E2E Smoke Coverage

## Problem

Критические сценарии описаны в правилах тестирования, но их нужно покрыть автоматизированными smoke-проверками.

## Desired Behavior

Есть e2e smoke coverage для auth, clients CRUD, appointments CRUD и offline sync.

## Current Context

Основной документ: `docs/rules-and-testing.md`. Frontend использует React/Vite, backend Hono, local-first flows идут через Dexie/outbox.

## Plan

- Выбрать минимальный набор smoke-сценариев перед production.
- Добавить e2e setup без расширения продуктового scope.
- Покрыть регистрацию/login, pending/active flow, clients CRUD, appointments CRUD и offline sync.
- Добавить команду запуска в документацию.

## Tests

- Smoke suite проходит локально против frontend `127.0.0.1:5173` и API `127.0.0.1:3000`.
- Тесты проверяют пользовательский flow, а не внутреннюю реализацию компонентов.

## Risks

- E2E может стать нестабильным, если зависеть от таймингов вместо видимых состояний UI.
- Нужна изоляция тестовых данных.

## Result

Заполнить после реализации.
