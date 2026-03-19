# CLAUDE.md — Changes for Session 18

Apply these diffs to the existing CLAUDE.md. Sections are identified by their headers.

---

## 1. Top of file — rename

```diff
-**ProMemo** — internal real estate agent platform for Wealth Realty (fidt.vn).
+**Realty Hub** (formerly ProMemo) — internal real estate agent platform for Wealth Realty (fidt.vn).
```

---

## 2. After "## Session Kickoff & Scope Management" — add new section

```markdown
## Development Workflow

Two loops. Files are the handoff, not conversation memory.

### Planning (Claude.ai)
1. Review last session's commit + test results
2. Create ADRs for design decisions → `docs/adrs/`
3. Update `docs/SCOPE.md` with next session's tasks
4. Update Linear issues (move cards, create new)
5. Commit planning artifacts to `main`

### Execution (Claude Code session)
1. Read `CLAUDE.md` (how) and `docs/SCOPE.md` (what)
2. Execute tasks top-down from SCOPE.md
3. Mark completed tasks with `[x]` — do NOT reshuffle the list
4. Handle live bug reports from user in chat
5. End session: `npx tsc --noEmit` → `git commit -m "Session ##: <summary>"` → push
6. `/export` before closing

### Rules
- If it's not in SCOPE.md, it doesn't exist
- ADRs are read-only during execution — do not modify them
- CHANGELOG.md updated at end of session
- Branch strategy specified per session in SCOPE.md header

## Branching Strategy

- **`main`** = production. Always deployable. Runs on GCP VM.
- **`develop`** = daily work branch. Claude Code commits here.
- **Feature branches** (`feature/<name>`) = risky work off `develop`. Merge back when stable.

Daily workflow:
1. Before session: `git checkout develop && git pull`
2. Claude Code works on `develop`
3. After validated: `git checkout main && git merge develop && git push`
4. Deploy: `ssh VM && git pull && ./scripts/deploy-vm.sh update`

## Project Management

- **Linear** (linear.app/realty-hub): Client-facing board, issue tracking. Team: Realty Hub, prefix: REA.
- **SCOPE.md**: Session-level task contract for Claude Code (source of truth for daily work).
- Linear issues are referenced in SCOPE.md by ID (e.g., REA-5). Claude Code does not need to read Linear directly.
```

---

## 3. Repo structure — update

```diff
 docs/
   SCHEMA.md                   <- Canonical DB schema (source of truth)
   CHANGELOG.md                <- What changed
   ARCHITECTURE.md             <- System design
   DEPLOYMENT.md               <- VM deployment guide
+  RUNBOOK.md                  <- Production operations (Session 18)
   SCOPE.md                    <- Active sprint and next actions
+  adrs/                       <- Architecture Decision Records (ADR-001 through ADR-003)
   code_sessions/              <- Individual session logs
+    SESSION_LOG.md            <- Legacy monolithic log (to be split + archived in Session 18)
   chat_exports/               <- Claude Code conversation exports
+    {DATE}/                   <- Daily subdirectories (auto by claude-log.sh)
+  archive/                    <- Stale/legacy files
 scripts/
   create_agent.sh             <- Admin account creation
   deploy-vm.sh                <- GCP VM deployment
+  backup-db.sh                <- DB backup (Session 18)
+  claude-log.sh               <- Chat export organizer (cron 30min)
```

---

## 4. Bottom of file — session counter

```diff
-**Current session number: 17**
-**Last completed session: 16 — 2026-03-16 — Photo & Document Staging at Listing Creation**
-**Deployment: Google Cloud VM — see `docs/DEPLOYMENT.md` for full guide**
+**Current session number: 18**
+**Last completed session: 17 — 2026-03-17 — VM Deploy, /export Pipeline, DEPLOYMENT.md**
+**Deployment: Google Cloud VM — see `docs/DEPLOYMENT.md` for full guide**
+**Sprint: Pilot Launch (Mar 19–22) — see `docs/SCOPE.md`**
+**Linear: https://linear.app/realty-hub**
```
