#!/usr/bin/env bash

set -euo pipefail

ROOT="$HOME/dev_projects/re-nhatrang"
EXPORT_BASE="$ROOT/docs/chat_exports"

DATE=$(date +%F)
TIME=$(date +%H:%M:%S)

DAY_DIR="$EXPORT_BASE/$DATE"
LOGFILE="$EXPORT_BASE/$DATE.md"

mkdir -p "$DAY_DIR"
touch "$LOGFILE"

# find newest txt in root
NEW_FILE=$(ls -t "$ROOT"/*.txt 2>/dev/null | head -n 1 || true)

if [ -z "$NEW_FILE" ]; then
    echo "No new exports found"
    exit 0
fi

BASENAME=$(basename "$NEW_FILE")

# find latest previous txt in today's folder
LAST_FILE=$(ls -t "$DAY_DIR"/*.txt 2>/dev/null | head -n 1 || true)

TMP_DIFF=$(mktemp)

if [ -z "$LAST_FILE" ]; then
    # first file of the day → take whole content
    cat "$NEW_FILE" > "$TMP_DIFF"
else
    # compute only newly added lines
    diff \
      --new-line-format="%L" \
      --old-line-format="" \
      --unchanged-line-format="" \
      "$LAST_FILE" "$NEW_FILE" > "$TMP_DIFF" || true
fi

# check if diff has meaningful content
if [ ! -s "$TMP_DIFF" ]; then
    echo "No new content to append"
else
    {
        echo ""
        echo "---------------------------------------"
        echo ""
        echo "## Append — $TIME ($BASENAME)"
        echo ""
        echo '```'
        cat "$TMP_DIFF"
        echo '```'
        echo ""
        echo "---------------------------------------"
        echo ""
    } >> "$LOGFILE"

    echo "Appended new content to $LOGFILE"
fi

# move txt into day folder (always)
mv "$NEW_FILE" "$DAY_DIR/$BASENAME"

rm "$TMP_DIFF"