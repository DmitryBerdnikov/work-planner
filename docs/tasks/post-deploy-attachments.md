# Post-Deploy Attachments

## Problem

Фото и attachments отложены до post-deploy этапа, но направление нужно держать в backlog.

## Desired Behavior

После production deploy можно добавить online-only attachments для записей с ограничениями по количеству и размеру.

## Current Context

Правила описаны в `docs/rules-and-testing.md`: до 3 фото на запись, до 2 MB на фото после сжатия, offline-sync не включает attachments.

## Plan

- Спроектировать storage abstraction для локальной файловой системы VPS.
- Добавить backend endpoints для upload/delete/list.
- Добавить frontend UI для attachments в записи.
- Обновить backup-процесс, чтобы включать uploads.

## Tests

- Upload отклоняет файлы сверх лимитов.
- Delete удаляет attachment из UI и storage.
- Offline режим не пытается синхронизировать attachments.

## Risks

- Можно случайно смешать attachments с offline sync scope.
- Нужно не забыть включить uploads в backup.

## Result

Заполнить после реализации.
