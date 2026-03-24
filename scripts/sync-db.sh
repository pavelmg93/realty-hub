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
VM_HOST="${VM_HOST:-re-vm}"  # override: VM_HOST=user@ip ./scripts/sync-db.sh

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
# 3. pg_dump from production via SSH, pipe directly to local restore
# ---------------------------------------------------------------------------
echo ""
echo "Dumping production DB and restoring to local container..."
echo "(This may take a moment depending on DB size and network speed.)"
echo ""

ssh "${VM_HOST}" \
  "docker exec realty-hub-app-postgres-1 pg_dump -U ${DB_USER} --clean --if-exists -Fc ${DB_NAME}" \
  | docker exec -i "${LOCAL_CONTAINER}" \
      pg_restore -U "${DB_USER}" --clean --if-exists -d "${DB_NAME}" --no-owner --no-privileges

echo ""
echo "Done. Local database '${DB_NAME}' has been replaced with the production snapshot."
