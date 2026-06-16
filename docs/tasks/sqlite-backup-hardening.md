# SQLite Backup Hardening

## Problem

Backup сейчас описан как ручной процесс. Нужно проверить, что он безопасен для активной SQLite database и пригоден для восстановления.

## Desired Behavior

Есть проверенный backup/restore процесс для production SQLite database, который не опирается на простое копирование файла во время активной записи.

## Current Context

Основной документ: `docs/11-backups.md`. Production database хранится как SQLite-файл на VPS.

## Plan

- Проверить текущие backup-инструкции.
- Описать точную команду создания консистентного SQLite backup.
- Описать restore в staging-like директорию.
- Добавить smoke-проверку восстановленной базы.

## Tests

- Backup-архив создается без остановки backend.
- Restore на тестовом пути открывается через `sqlite3`.
- После restore backend проходит `GET /api/health` и базовый CRUD smoke.

## Risks

- Неконсистентный backup может не восстановиться.
- Backup нельзя хранить только на production VPS.

## Result

Заполнить после реализации.
