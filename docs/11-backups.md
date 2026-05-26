# Manual backups

SQLite backup нельзя делать простым копированием активного файла. Использовать `sqlite3 .backup`.

## Create backup on VPS

```bash
sudo -u work-planner /var/www/work-planner/staging/backend/current/infra/scripts/backup-sqlite.sh staging
sudo -u work-planner /var/www/work-planner/production/backend/current/infra/scripts/backup-sqlite.sh production
```

Архив создается в:

```text
/var/www/work-planner/<env>/backups/
```

Архив включает SQLite snapshot, manifest и env-файл, если процесс может его прочитать. Env-файл содержит секреты, поэтому архив хранить только в защищенном внешнем месте.

## Download backup

```bash
scp deploy@<host>:/var/www/work-planner/production/backups/work-planner-production-YYYYMMDDTHHMMSSZ.tar.gz .
```

Не хранить единственную копию backup на том же VPS.

## Restore checklist

1. Остановить сервис:

```bash
sudo systemctl stop work-planner-production
```

2. Сохранить текущую базу перед restore:

```bash
sudo -u work-planner cp /var/www/work-planner/production/data/app.sqlite /var/www/work-planner/production/data/app.sqlite.before-restore
```

3. Распаковать архив во временную директорию.

4. Заменить базу:

```bash
sudo -u work-planner install -m 600 app-YYYYMMDDTHHMMSSZ.sqlite /var/www/work-planner/production/data/app.sqlite
```

5. Запустить сервис и проверить health:

```bash
sudo systemctl start work-planner-production
curl -fsS https://app.example.com/api/health
```

6. Проверить login, CRUD и sync.
