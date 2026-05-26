#!/usr/bin/env sh
set -eu

ENV_NAME="${1:-}"

if [ "$ENV_NAME" != "staging" ] && [ "$ENV_NAME" != "production" ]; then
  echo "Usage: $0 staging|production" >&2
  exit 2
fi

command -v sqlite3 >/dev/null 2>&1 || {
  echo "sqlite3 CLI is required" >&2
  exit 1
}

ROOT="${WORK_PLANNER_ROOT:-/var/www/work-planner}"
ENV_DIR="$ROOT/$ENV_NAME"
DB_PATH="${DATABASE_PATH:-$ENV_DIR/data/app.sqlite}"
BACKUP_DIR="${BACKUP_DIR:-$ENV_DIR/backups}"
ENV_FILE="${ENV_FILE:-/etc/work-planner/$ENV_NAME.env}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TMP_DB="$BACKUP_DIR/app-$STAMP.sqlite"
MANIFEST="$BACKUP_DIR/manifest-$STAMP.txt"
ARCHIVE="$BACKUP_DIR/work-planner-$ENV_NAME-$STAMP.tar.gz"

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found: $DB_PATH" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
sqlite3 "$DB_PATH" ".backup '$TMP_DB'"

{
  echo "environment=$ENV_NAME"
  echo "database=$DB_PATH"
  echo "created_at_utc=$STAMP"
  echo "host=$(hostname)"
} > "$MANIFEST"

if [ -r "$ENV_FILE" ]; then
  tar -czf "$ARCHIVE" \
    -C "$BACKUP_DIR" "$(basename "$TMP_DB")" "$(basename "$MANIFEST")" \
    -C "$(dirname "$ENV_FILE")" "$(basename "$ENV_FILE")"
else
  tar -czf "$ARCHIVE" \
    -C "$BACKUP_DIR" "$(basename "$TMP_DB")" "$(basename "$MANIFEST")"
fi

rm -f "$TMP_DB" "$MANIFEST"
echo "$ARCHIVE"

