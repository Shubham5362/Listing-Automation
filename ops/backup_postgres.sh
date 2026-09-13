#!/usr/bin/env sh
set -eu

: "${POSTGRES_HOST:=db}"
: "${POSTGRES_PORT:=5432}"
: "${POSTGRES_DB:=seller_hub}"
: "${POSTGRES_USER:=seller_hub}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${BACKUP_DIR:=/backups}"
: "${BACKUP_RETENTION_DAYS:=14}"

mkdir -p "$BACKUP_DIR"
export PGPASSWORD="$POSTGRES_PASSWORD"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
file="$BACKUP_DIR/${POSTGRES_DB}_${timestamp}.dump"
pg_dump --format=custom --no-owner --no-privileges --host="$POSTGRES_HOST" --port="$POSTGRES_PORT" --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --file="$file"
find "$BACKUP_DIR" -type f -name '*.dump' -mtime "+$BACKUP_RETENTION_DAYS" -delete
pg_restore --list "$file" >/dev/null
printf '%s\n' "$file"
