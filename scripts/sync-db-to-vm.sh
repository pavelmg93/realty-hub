#!/usr/bin/env bash
# sync-db-to-vm.sh — Sync local DB + uploads to a remote GCP VM
#
# Usage:
#   ./scripts/sync-db-to-vm.sh              # sync DB + uploads
#   ./scripts/sync-db-to-vm.sh --db-only    # sync DB only
#   ./scripts/sync-db-to-vm.sh --uploads-only  # sync uploads only
#
# Prerequisites:
#   - Local docker running with postgres container
#   - SSH access to VM (configured as VM_HOST in .env)
#   - VM has repo cloned and docker compose running

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
else
  echo "ERROR: .env not found at $PROJECT_DIR/.env"
  exit 1
fi

# Config from .env
LOCAL_CONTAINER="${LOCAL_CONTAINER:-realty-hub-app-postgres-1}"
DB_USER="${DB_USER:-re_nhatrang}"
DB_NAME="${DB_NAME:-re_nhatrang}"
VM_HOST="${VM_HOST:-re-prod}"

# VM container name matches local (docker compose service = app-postgres)
REMOTE_CONTAINER="$LOCAL_CONTAINER"

# Remote project path — same repo structure
REMOTE_PROJECT_DIR="realty-hub"

# Parse args
SYNC_DB=true
SYNC_UPLOADS=true
if [ "${1:-}" = "--db-only" ]; then
  SYNC_UPLOADS=false
elif [ "${1:-}" = "--uploads-only" ]; then
  SYNC_DB=false
fi

DUMP_FILE="/tmp/realty-hub-sync-$(date +%Y%m%d-%H%M%S).sql.gz"

echo "=== Realty Hub DB Sync: local → $VM_HOST ==="
echo ""

# ─── 1. Dump local DB ───
if [ "$SYNC_DB" = true ]; then
  echo ">>> Dumping local DB from container $LOCAL_CONTAINER..."
  docker exec "$LOCAL_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" \
    --no-owner --no-privileges \
    | gzip > "$DUMP_FILE"
  DUMP_SIZE=$(du -sh "$DUMP_FILE" | cut -f1)
  echo ">>> Dump complete: $DUMP_SIZE"

  # ─── 2. Copy dump to VM ───
  echo ">>> Copying dump to $VM_HOST..."
  scp "$DUMP_FILE" "$VM_HOST:/tmp/$(basename "$DUMP_FILE")"
  echo ">>> Copy complete"

  # ─── 3. Restore on VM ───
  echo ">>> Restoring DB on $VM_HOST..."
  REMOTE_DUMP="/tmp/$(basename "$DUMP_FILE")"
  ssh "$VM_HOST" bash -s "$REMOTE_CONTAINER" "$DB_USER" "$DB_NAME" "$REMOTE_DUMP" <<'REMOTE_SCRIPT'
    set -euo pipefail
    CONTAINER="$1"
    USER="$2"
    DBNAME="$3"
    DUMP="$4"

    echo "  Waiting for postgres container..."
    for i in $(seq 1 15); do
      if docker exec "$CONTAINER" pg_isready -U "$USER" > /dev/null 2>&1; then
        break
      fi
      if [ "$i" = "15" ]; then
        echo "  ERROR: postgres container not ready"
        exit 1
      fi
      sleep 2
    done

    echo "  Dropping and recreating database..."
    docker exec "$CONTAINER" psql -U "$USER" -d postgres -c "
      SELECT pg_terminate_backend(pid) FROM pg_stat_activity
      WHERE datname = '$DBNAME' AND pid <> pg_backend_pid();
    " > /dev/null 2>&1 || true
    docker exec "$CONTAINER" psql -U "$USER" -d postgres -c "DROP DATABASE IF EXISTS $DBNAME;"
    docker exec "$CONTAINER" psql -U "$USER" -d postgres -c "CREATE DATABASE $DBNAME OWNER $USER;"

    echo "  Restoring from dump..."
    gunzip -c "$DUMP" | docker exec -i "$CONTAINER" psql -U "$USER" -d "$DBNAME" --quiet 2>&1 | tail -3

    echo "  Verifying..."
    docker exec "$CONTAINER" psql -U "$USER" -d "$DBNAME" -c "
      SELECT 'agents' as tbl, COUNT(*) FROM agents
      UNION ALL SELECT 'listings', COUNT(*) FROM parsed_listings
      UNION ALL SELECT 'photos', COUNT(*) FROM listing_photos
      UNION ALL SELECT 'conversations', COUNT(*) FROM conversations;
    "

    echo "  Cleaning up remote dump..."
    rm -f "$DUMP"
REMOTE_SCRIPT

  echo ">>> DB restore complete"

  # Clean up local dump
  rm -f "$DUMP_FILE"
fi

# ─── 4. Sync uploads ───
if [ "$SYNC_UPLOADS" = true ]; then
  echo ""
  echo ">>> Syncing uploads directory to $VM_HOST..."
  rsync -avz --progress \
    "$PROJECT_DIR/uploads/" \
    "$VM_HOST:$REMOTE_PROJECT_DIR/uploads/"
  echo ">>> Uploads sync complete"
fi

echo ""
echo "=== Sync complete ==="
echo ""
echo "  Next steps on VM:"
echo "    ssh $VM_HOST"
echo "    cd $REMOTE_PROJECT_DIR && docker compose restart web"
echo ""
