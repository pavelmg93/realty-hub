#!/usr/bin/env bash
# sync-db.sh
#
# DIRECTION: PRODUCTION (read-only) → LOCAL (overwrite)
#
# This script pulls a pg_dump from the production VM and restores it to the
# local Docker Postgres container. Production is NEVER written to — it is
# accessed via SSH for pg_dump only (read-only operation).
#
# The restore target is HARDCODED to the local Docker container. There is no
# --target flag by design. The --clean --if-exists flags drop and recreate
# tables in the LOCAL database only; they would be catastrophic if pointed at
# production, which is why the target is not configurable.
#
# Usage:
#   ./scripts/sync-db.sh
#
# Override the VM host (default: re-vm, expects SSH alias in ~/.ssh/config):
#   VM_HOST=user@1.2.3.4 ./scripts/sync-db.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Config (hardcoded, never parameterizable)
# ---------------------------------------------------------------------------
LOCAL_CONTAINER="realty-hub-app-postgres-1"
DB_USER="re_nhatrang"
DB_NAME="re_nhatrang"
VM_HOST="re-prod"  # override: VM_HOST=user@ip ./scripts/sync-db.sh

# ---------------------------------------------------------------------------
# 1. Check local container is running
# ---------------------------------------------------------------------------
echo "Checking local Docker container..."
if ! docker ps --format '{{.Names}}' | grep -q "^${LOCAL_CONTAINER}$"; then
  echo "ERROR: Local container '${LOCAL_CONTAINER}' is not running."
  echo "Start it with: docker compose up -d"
  exit 1
fi
echo "  Container '${LOCAL_CONTAINER}' is running."

# ---------------------------------------------------------------------------
# 2. Confirmation prompt
# ---------------------------------------------------------------------------
echo ""
echo "========================================================="
echo "  SYNC: PRODUCTION → LOCAL"
echo "========================================================="
echo "  Source : ${VM_HOST} (production, read-only)"
echo "  Target : ${LOCAL_CONTAINER} (local Docker container)"
echo "  DB     : ${DB_NAME}"
echo ""
echo "  This will OVERWRITE your LOCAL database."
echo "  Production is NOT affected."
echo "========================================================="
echo ""
read -r -p "Continue? [y/N] " CONFIRM
case "${CONFIRM}" in
  [yY][eE][sS]|[yY])
    ;;
  *)
    echo "Aborted."
    exit 0
    ;;
esac

# ---------------------------------------------------------------------------
# 3. Drop and recreate the local database for a clean restore
# ---------------------------------------------------------------------------
echo ""
echo "Dropping and recreating local database for clean restore..."
docker exec -i "${LOCAL_CONTAINER}" psql -U "${DB_USER}" -d postgres <<SQL
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS ${DB_NAME};
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
SQL

# ---------------------------------------------------------------------------
# 4. Dump production as plain SQL and restore locally
# ---------------------------------------------------------------------------
echo "Dumping production DB (plain SQL) and restoring to local container..."
echo "(This may take a moment depending on DB size and network speed.)"
echo ""

# pg_dump sets search_path to empty, which breaks immutable_unaccent
# (it calls unaccent() which lives in the public schema). Fix on the fly
# by keeping 'public' in the search_path during restore.
ssh -i ~/.ssh/google_compute_engine "${VM_HOST}" \
  "docker exec realty-hub-app-postgres-1 pg_dump -U ${DB_USER} ${DB_NAME}" \
  | sed "s/SELECT pg_catalog.set_config('search_path', '', false)/SELECT pg_catalog.set_config('search_path', 'public, pg_catalog', false)/" \
  | docker exec -i "${LOCAL_CONTAINER}" \
    psql -U "${DB_USER}" -d "${DB_NAME}" --quiet -v ON_ERROR_STOP=0

echo ""
echo "Done. Local database '${DB_NAME}' has been replaced with the production snapshot."
