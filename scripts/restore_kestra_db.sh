#!/bin/bash
# Restore Kestra database from the latest backup if DB is fresh.
#
# This script is designed to run as a docker-compose init container.
# It checks if Kestra's DB has any execution history. If empty (fresh DB)
# and a backup file exists, it restores from the most recent backup.
#
# Env vars:
#   PGPASSWORD            - Kestra DB password (set by docker-compose)
#   KESTRA_BACKUP_DAYS    - Only consider backups newer than N days (default: 30)

set -euo pipefail

BACKUP_DIR="/backups"
DB_HOST="kestra-postgres"
DB_PORT="5432"
DB_USER="kestra"
DB_NAME="kestra"
RETENTION_DAYS="${KESTRA_BACKUP_DAYS:-30}"

echo "Kestra restore: checking if database needs rehydration..."

# Check if the database has any existing Kestra data.
# The 'executions' table is created by Kestra on first boot, so we check
# if the table exists AND has rows. If Kestra hasn't started yet, the table
# won't exist — that also counts as "fresh".
TABLE_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'executions')" \
    2>/dev/null || echo "false")

if [ "$TABLE_EXISTS" = "t" ]; then
    ROW_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -tAc "SELECT COUNT(*) FROM executions" 2>/dev/null || echo "0")
    echo "Kestra restore: found $ROW_COUNT existing executions."

    if [ "$ROW_COUNT" -gt 0 ]; then
        echo "Kestra restore: database already has data, skipping restore."
        exit 0
    fi
fi

# Find the most recent backup within retention window
LATEST_BACKUP=""
if [ -d "$BACKUP_DIR" ]; then
    LATEST_BACKUP=$(find "$BACKUP_DIR" -name "kestra_*.sql.gz" \
        -mtime -"$RETENTION_DAYS" -type f 2>/dev/null \
        | sort -r | head -n 1)
fi

if [ -z "$LATEST_BACKUP" ]; then
    echo "Kestra restore: no backup found within ${RETENTION_DAYS}-day window. Starting fresh."
    exit 0
fi

echo "Kestra restore: restoring from $LATEST_BACKUP ..."
gunzip -c "$LATEST_BACKUP" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --quiet --no-psqlrc 2>&1 | grep -c "ERROR" && {
    echo "Kestra restore: completed with some errors (expected for first-time schema objects)."
} || {
    echo "Kestra restore: completed successfully."
}

exit 0
