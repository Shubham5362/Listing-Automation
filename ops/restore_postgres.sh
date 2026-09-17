#!/usr/bin/env sh
set -eu

: "${POSTGRES_HOST:=db}"
: "${POSTGRES_PORT:=5432}"
: "${POSTGRES_DB:=seller_hub}"
: "${POSTGRES_USER:=seller_hub}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${BACKUP_FILE:?BACKUP_FILE is required}"

[ -f "$BACKUP_FILE" ] || { echo "Backup file not found: $BACKUP_FILE" >&2; exit 1; }
export PGPASSWORD="$POSTGRES_PASSWORD"
pg_restore --clean --if-exists --no-owner --no-privileges --host="$POSTGRES_HOST" --port="$POSTGRES_PORT" --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" "$BACKUP_FILE"
psql --host="$POSTGRES_HOST" --port="$POSTGRES_PORT" --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" -c 'SELECT 1;' >/dev/null
printf '%s\n' 'PostgreSQL restore completed and connectivity verified.'
