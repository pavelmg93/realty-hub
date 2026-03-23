#!/bin/bash
# scripts/migrate.sh — Run pending DB migrations safely
#
# Usage:
#   ./scripts/migrate.sh
#
# Requires docker compose to be running with app-postgres healthy.
# Tracks applied migrations in schema_migrations table.
# Safe to run multiple times — skips already-applied versions.

set -e

DB_USER="${APP_DB_USER:-re_nhatrang}"
DB_NAME="${APP_DB_NAME:-re_nhatrang}"
MIGRATIONS_DIR="src/db/migrations"

echo ">>> Running migrations from $MIGRATIONS_DIR..."

# Ensure schema_migrations table exists and has all expected columns (self-heal)
docker compose exec -T app-postgres psql -U "$DB_USER" -d "$DB_NAME" <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS description TEXT;
SQL

APPLIED=0
SKIPPED=0

for migration_file in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
  version=$(basename "$migration_file" .sql)

  # Check if already applied
  already_applied=$(docker compose exec -T app-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM schema_migrations WHERE version = '$version';" 2>/dev/null | tr -d ' ')

  if [ "$already_applied" = "1" ]; then
    echo "   [skip] $version"
    SKIPPED=$((SKIPPED + 1))
  else
    echo "   [apply] $version"
    docker compose exec -T app-postgres psql -U "$DB_USER" -d "$DB_NAME" < "$migration_file"
    docker compose exec -T app-postgres psql -U "$DB_USER" -d "$DB_NAME" -c \
      "INSERT INTO schema_migrations (version) VALUES ('$version') ON CONFLICT DO NOTHING;" > /dev/null
    APPLIED=$((APPLIED + 1))
  fi
done

echo ">>> Migrations complete: $APPLIED applied, $SKIPPED skipped"
