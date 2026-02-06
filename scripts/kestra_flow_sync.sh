#!/bin/bash
# Kestra flow sync script
# Usage:
#   ./scripts/kestra_flow_sync.sh push   — Push local files to Kestra DB (deletes removed flows)
#   ./scripts/kestra_flow_sync.sh pull   — Pull flows from Kestra DB to local files
#
# Requires KESTRA_USER env var (e.g. "user@email.com:password")
# or set it in .env as KESTRA_USER=user@email.com:password

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FLOWS_DIR="$PROJECT_DIR/kestra/flows"
NAMESPACE="re-nhatrang"
CONTAINER="re-nhatrang-kestra-1"

# Load .env if present
if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    source "$PROJECT_DIR/.env"
    set +a
fi

if [ -z "${KESTRA_USER:-}" ]; then
    echo "ERROR: KESTRA_USER not set. Export it or add to .env"
    echo "  Example: export KESTRA_USER='user@email.com:password'"
    exit 1
fi

CMD="$1"

case "$CMD" in
    push)
        echo "Pushing local flows to Kestra DB (with --delete)..."
        docker exec "$CONTAINER" java -jar /app/kestra flow namespace update \
            --delete "$NAMESPACE" /app/flows \
            --server http://localhost:8080 \
            --user "$KESTRA_USER" 2>&1 | grep -v WARN
        echo "Done."
        ;;
    pull)
        echo "Pulling flows from Kestra DB to local files..."
        # Export flows as ZIP to a temp dir inside container
        docker exec "$CONTAINER" rm -rf /tmp/flows-export
        docker exec "$CONTAINER" mkdir -p /tmp/flows-export
        docker exec "$CONTAINER" java -jar /app/kestra flow export \
            --namespace "$NAMESPACE" \
            --server http://localhost:8080 \
            --user "$KESTRA_USER" \
            /tmp/flows-export 2>&1 | grep -v WARN

        # Copy exported ZIP to host and extract
        TMPDIR=$(mktemp -d)
        docker cp "$CONTAINER:/tmp/flows-export/." "$TMPDIR/"

        # Find the ZIP and extract, or copy YAMLs directly
        if ls "$TMPDIR"/*.zip 1>/dev/null 2>&1; then
            rm -f "$FLOWS_DIR"/"$NAMESPACE".*.yml
            cd "$FLOWS_DIR"
            unzip -o "$TMPDIR"/*.zip
        elif ls "$TMPDIR"/*.yml 1>/dev/null 2>&1; then
            rm -f "$FLOWS_DIR"/"$NAMESPACE".*.yml
            cp "$TMPDIR"/*.yml "$FLOWS_DIR/"
        else
            echo "ERROR: No flow files found in export"
            rm -rf "$TMPDIR"
            exit 1
        fi
        rm -rf "$TMPDIR"
        echo "Done. Flows pulled to $FLOWS_DIR"
        ;;
    *)
        echo "Usage: $0 {push|pull}"
        echo "  push  — Sync local flow files to Kestra DB (deletes removed flows)"
        echo "  pull  — Export flows from Kestra DB to local files"
        exit 1
        ;;
esac
