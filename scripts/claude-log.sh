#!/usr/bin/env bash

set -euo pipefail

ROOT="$HOME/dev_projects/re-nhatrang"
EXPORT_BASE="$ROOT/docs/chat_exports"

DATE=$(date +%F)

DAY_DIR="$EXPORT_BASE/$DATE"
LOGFILE="$EXPORT_BASE/$DATE.md"

mkdir -p "$DAY_DIR"
touch "$LOGFILE"

# Get all txt files in root, oldest → newest
FILES=$(ls -tr "$ROOT"/*.txt 2>/dev/null || true)

if [ -z "$FILES" ]; then
    echo "No new exports found"
    exit 0
fi

# Start from last archived file today (if any)
LAST_FILE=$(ls -t "$DAY_DIR"/*.txt 2>/dev/null | head -n 1 || true)

for NEW_FILE in $FILES; do

    BASENAME=$(basename "$NEW_FILE")

    # Skip if already processed
    if [ -f "$DAY_DIR/$BASENAME" ]; then
        echo "Skipping already processed: $BASENAME"
        continue
    fi

    # Skip append if file already inside daily markdown file
    if grep -q "($BASENAME)" "$LOGFILE"; then
        echo "Already processed: $BASENAME"
        mv "$NEW_FILE" "$DAY_DIR/$BASENAME"
        continue
    fi

    TMP_DIFF=$(mktemp)

    # Compute incremental diff
    if [ -z "$LAST_FILE" ]; then
        # First file of the day → take full content
        cat "$NEW_FILE" > "$TMP_DIFF"
    else
        diff \
          --new-line-format="%L" \
          --old-line-format="" \
          --unchanged-line-format="" \
          "$LAST_FILE" "$NEW_FILE" > "$TMP_DIFF" || true
    fi

    if [ -s "$TMP_DIFF" ]; then

        TIME=$(date +%H:%M:%S)

        # Dynamic fence detection (safe for nested ``` blocks)
        MAX_TICKS=$(grep -o '`\{3,\}' "$TMP_DIFF" | awk '{ print length }' | sort -nr | head -n1 || echo 3)
        FENCE=$(printf '%*s' $((MAX_TICKS + 1)) '' | tr ' ' '`')

        LINES_1=$(awk 'END {print NR+0}' "$TMP_DIFF")
        {
            echo ""
            echo "<details>"
            echo "<summary><strong>Append — $TIME ($BASENAME)</strong> [$LINES_1 lines]</summary>"

            echo ""
            echo "$FENCE"
            cat "$TMP_DIFF"
            echo ""
            echo "$FENCE"

            echo ""
            echo "</details>"
            echo ""
            
        } >> "$LOGFILE"

        echo "Appended $BASENAME ($LINES_1 lines)"

    else
        echo "No new content in $BASENAME"
    fi


    # Move NEW_FILE into daily folder
    mv "$NEW_FILE" "$DAY_DIR/$BASENAME"

    # Update LAST_FILE so next diff chains correctly
    LAST_FILE="$DAY_DIR/$BASENAME"

    rm "$TMP_DIFF"

done

echo "Done."