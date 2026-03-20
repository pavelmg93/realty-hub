#!/usr/bin/env bash
# backup-db.sh — pg_dump the Realty Hub database to backups/
# Usage: ./scripts/backup-db.sh
# Retention: keeps 7 most recent daily backups, deletes older ones.

set -euo pipefail

CONTAINER="re-nhatrang-app-postgres-1"
DB_USER="re_nhatrang"
DB_NAME="re_nhatrang"
BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${TIMESTAMP}.sql.gz"
RETAIN_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "[backup-db] Starting backup → ${BACKUP_FILE}"

docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" \
  | gzip > "$BACKUP_FILE"

echo "[backup-db] Backup complete: $(du -sh "$BACKUP_FILE" | cut -f1)"

# Delete backups older than RETAIN_DAYS
echo "[backup-db] Pruning backups older than ${RETAIN_DAYS} days..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETAIN_DAYS" -print -delete

REMAINING=$(find "$BACKUP_DIR" -name "*.sql.gz" | wc -l | tr -d ' ')
echo "[backup-db] Done. ${REMAINING} backup(s) retained."
