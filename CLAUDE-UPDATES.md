# CLAUDE.md Updates — Linear MCP Workflow

**Apply these changes to CLAUDE.md. Replace the relevant sections.**

---

## Replace: "Session Kickoff & Scope Management" section

```markdown
## Session Kickoff & Scope Management

When we begin a new task, or if I ask "what should we do next":
1. **Read `docs/SCOPE.md`** — it contains the session task list with Linear issue IDs.
2. **For each task, read the full spec from Linear:** Run `get_issue REA-XX` via Linear MCP to get the complete description, acceptance criteria, and comments. SCOPE.md only has one-line titles — the detail lives in Linear.
3. Focus ONLY on items listed in the current session section of SCOPE.md.
4. Do not suggest or write code for Backlog items unless explicitly told to.
5. When we complete a task, mark it `[x]` in SCOPE.md AND move the Linear issue to Done.
```

---

## Replace: "Development Workflow" section

```markdown
## Development Workflow

Two loops. Linear is the spec, files are the handoff.

### Planning (Claude.ai)
1. Review last session's deploy + test results
2. Create/update Linear issues with full specs (descriptions, acceptance criteria, comments)
3. Update `docs/SCOPE.md` with session task list (issue IDs + one-line titles only)
4. Create ADRs for architectural decisions → `docs/adrs/`
5. Commit planning artifacts to `main`

### Execution (Claude Code session)
1. Read `CLAUDE.md` (how) and `docs/SCOPE.md` (what)
2. **For each task: `get_issue REA-XX` via Linear MCP — read the FULL spec before coding**
3. Execute tasks top-down from SCOPE.md
4. Mark completed tasks with `[x]` in SCOPE.md
5. Move completed Linear issues to Done

### After Every Session (AUTOMATIC — do not wait for user to ask)
1. Create a code session log in `docs/code_sessions/YYYY-MM-DD-sessionNN-brief-topic.md` using the Code Session Template
2. Update `docs/CHANGELOG.md` with session changes
3. Mark completed tasks in `docs/SCOPE.md` with `[x]`
4. Run `cd web && npx tsc --noEmit` — confirm clean
5. `git add -A` and suggest commit message: `Session NN: <brief summary>`
6. After user confirms: `git commit` and `git push`
7. Print reminder: `✅ Pushed. On VM: cd ~/realty-hub && git pull && ./scripts/deploy-vm.sh update`

### Rules
- If it's not in SCOPE.md, it doesn't exist for this session
- Linear issues are the source of truth for specs — SCOPE.md is just the checklist
- ADRs are read-only during execution — do not modify them
- CHANGELOG.md updated at end of session
```

---

## Add new section: "Linear MCP"

```markdown
## Linear MCP

Claude Code has access to Linear via MCP (cloud integration, no local setup needed).

**Available tools:** list_issues, get_issue, save_issue, save_comment, list_issue_statuses, list_issue_labels

**Workflow:**
- Before coding any task, run `get_issue REA-XX` to read the full spec
- After completing a task, move the issue to Done: `save_issue(id: "REA-XX", state: "Done")`
- If you discover a bug during execution, create a new issue: `save_issue(title: "...", team: "Realty Hub", ...)`
- Read comments on issues — they often contain root cause analysis and implementation hints

**Team:** Realty Hub | **Prefix:** REA
```

---

## Add new section: "Deployment"

```markdown
## Deployment

`deploy-vm.sh update` runs seed + migrate.sh + regenerate-titles.sh automatically.
NEVER suggest running migrations manually — deploy handles it.

End-of-session deploy instructions:
1. `git push`
2. On VM: `cd ~/realty-hub && git pull && ./scripts/deploy-vm.sh update`

That's it. No separate migration commands.
```

---

## Add new section: "ADR Rules"

```markdown
## ADRs (Architecture Decision Records)

- ADRs are HISTORICAL records. Never edit a past ADR — write a new one that supersedes it.
- Do NOT read ADRs during normal execution sessions. SCOPE.md and CLAUDE.md are the execution docs.
- Only read ADRs when making a NEW architectural decision and needing prior context.
- When reading ADRs, read newest-to-oldest (highest number first).
- ADR filename: `YYYY-MM-DD-ADR-###-short-title.md` in `docs/adrs/`
```

---

## Add new section: "Design Rules"

```markdown
## Design Rules

- **Layout constants:** Import from `web/src/lib/layout-constants.ts` — no hardcoded pixel values for topbar, bottomnav, map height, or page padding.
- **Page padding:** Always `px-4 sm:px-6` on content containers.
- **Bottom nav:** Always `fixed bottom-0`, height from LAYOUT constant, z-50. Must be visible on ALL pages at ALL times.
- **Map height:** Always uses `LAYOUT.MAP_HEIGHT` — must fit between topbar and bottomnav.
- **Two-line title (ADR-005):** Line 1 = `listing.street`. Line 2 = `listing.title_standardized || generateTitleStandardized(listing)`. Both lines SAME size/weight/color. No `address_raw`, no ward, no fallback concatenation.
- **Dark theme only** — no light mode variants needed.
- **Script permissions:** All new `.sh` files must have execute permission: `git update-index --chmod=+x scripts/new-script.sh`
```
