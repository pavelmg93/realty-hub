# Claude Code Migration

These files restore Claude Code's project memory on a new machine.

## What's included

- `memory/MEMORY.md` — Main project memory (loaded into system prompt)
- `memory/kestra.md` — Kestra workflow engine patterns and gotchas
- `memory/promemo_progress.md` — ProMemo implementation tracker
- `settings.json` — Global Claude Code settings

## How to restore on a new machine

### 1. Install Claude Code
```bash
npm install -g @anthropic-ai/claude-code
```

### 2. Clone the repo and cd into it
```bash
git clone https://github.com/pavelmg93/re-nhatrang
cd re-nhatrang
```

### 3. Run the restore script
```bash
bash claude-migrate/restore.sh
```

This copies memory files to the correct Claude Code project directory
and applies global settings.

### 4. Start Claude Code
```bash
claude
```

Claude will pick up CLAUDE.md from the repo root automatically.
The memory files provide cross-session context about the project.

## Notes

- CLAUDE.md (in repo root) is loaded automatically — no migration needed
- Memory files are project-scoped and stored by Claude based on the working directory path
- The restore script auto-detects the correct project path
- Conversation history does NOT migrate (it's local to each machine)
