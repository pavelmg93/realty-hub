#!/bin/bash
# Backup Kestra's Postgres database to logs/kestra/backups/
#
# Usage:
#   ./scripts/backup_kestra_db.sh
#   KESTRA_BACKUP_DAYS=14 ./scripts/backup_kestra_db.sh
#
# Requires: docker compose services running

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/logs/kestra/backups"
RETENTION_DAYS="${KESTRA_BACKUP_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/kestra_${TIMESTAMP}.sql.gz"

echo "Backing up Kestra database..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T kestra-postgres \
    pg_dump -U kestra -d kestra --clean --if-exists \
    | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup saved: $BACKUP_FILE ($BACKUP_SIZE)"

# Prune old backups beyond retention period
PRUNED=0
if [ -d "$BACKUP_DIR" ]; then
    while IFS= read -r old_backup; do
        rm -f "$old_backup"
        PRUNED=$((PRUNED + 1))
    done < <(find "$BACKUP_DIR" -name "kestra_*.sql.gz" -mtime +"$RETENTION_DAYS" 2>/dev/null)
fi

if [ "$PRUNED" -gt 0 ]; then
    echo "Pruned $PRUNED backups older than $RETENTION_DAYS days."
fi

echo "Done. Backups in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"/kestra_*.sql.gz 2>/dev/null || echo "  (none)"
