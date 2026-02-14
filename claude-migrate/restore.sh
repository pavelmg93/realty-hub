#!/usr/bin/env bash
# Restore Claude Code project memory on a new machine.
# Run from the repo root: bash claude-migrate/restore.sh
set -euo pipefail

CLAUDE_DIR="$HOME/.claude"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Claude stores project memory keyed by the absolute workspace path,
# with slashes replaced by dashes and leading dash.
WORKSPACE_PATH="$(cd "$REPO_DIR" && pwd)"
PROJECT_KEY=$(echo "$WORKSPACE_PATH" | sed 's|/|-|g')
PROJECT_DIR="$CLAUDE_DIR/projects/$PROJECT_KEY"
MEMORY_DIR="$PROJECT_DIR/memory"

echo "=== Claude Code Memory Restore ==="
echo "Workspace: $WORKSPACE_PATH"
echo "Project key: $PROJECT_KEY"
echo "Target: $MEMORY_DIR"
echo ""

# Create directories
mkdir -p "$MEMORY_DIR"

# Copy memory files
cp "$SCRIPT_DIR/memory/MEMORY.md" "$MEMORY_DIR/MEMORY.md"
cp "$SCRIPT_DIR/memory/kestra.md" "$MEMORY_DIR/kestra.md"
cp "$SCRIPT_DIR/memory/promemo_progress.md" "$MEMORY_DIR/promemo_progress.md"
echo "[OK] Memory files restored (3 files)"

# Copy global settings (only if not already set)
if [ ! -f "$CLAUDE_DIR/settings.json" ]; then
  mkdir -p "$CLAUDE_DIR"
  cp "$SCRIPT_DIR/settings.json" "$CLAUDE_DIR/settings.json"
  echo "[OK] Global settings restored"
else
  echo "[SKIP] Global settings already exist at $CLAUDE_DIR/settings.json"
fi

echo ""
echo "Done! Start Claude Code with: claude"
echo "CLAUDE.md in the repo root is picked up automatically."
