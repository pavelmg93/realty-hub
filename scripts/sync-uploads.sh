#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Config (Matches your re-prod SSH alias)
# ---------------------------------------------------------------------------
VM_HOST="re-prod"
REMOTE_DIR="~/realty-hub/uploads/"  # Ensure trailing slash
LOCAL_DIR="./uploads/"

# ---------------------------------------------------------------------------
# 1. Confirmation
# ---------------------------------------------------------------------------
echo "========================================================="
echo "  SYNC UPLOADS: PRODUCTION → LOCAL"
echo "========================================================="
echo "  Source : ${VM_HOST}:${REMOTE_DIR}"
echo "  Target : ${LOCAL_DIR}"
echo ""
read -r -p "Continue? [y/N] " CONFIRM
if [[ ! $CONFIRM =~ ^[yY]$ ]]; then
    echo "Aborted."
    exit 0
fi

# ---------------------------------------------------------------------------
# 2. Sync using rsync
# ---------------------------------------------------------------------------
# -a: archive mode (preserves permissions/times)
# -v: verbose
# -z: compress data during transfer
# --delete: optional! Removes local files if they were deleted on production
echo "Syncing files..."
rsync -avz --progress "${VM_HOST}:${REMOTE_DIR}" "${LOCAL_DIR}"

echo ""
echo "Done. Local uploads folder is now in sync with production."