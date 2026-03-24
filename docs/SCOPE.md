# Session 30b — Sequential Do-Over

**Date:** 2026-03-24

**For each task, run `get_issue REA-XX` via Linear MCP to read the full spec before coding.**

> **⚠️ NO SUBAGENTS. Execute all tasks SEQUENTIALLY in the main working tree.**
> S30 used subagents and worktree changes were lost. This session redoes the work directly.

---

## Session Scope (6 issues, sequential)

Execute in this exact order:

1. [x] **[REA-87] P0: Embedded messages in listing detail don't load existing conversations** *(3rd attempt — read escalation protocol in issue)*
2. [x] **[REA-90] Embedded messages: inconsistent agent info display across states**
3. [x] **[REA-89] Messages: show full two-line title in conversation header and inquiries list**
4. [x] **[REA-73] Listing status: rename For Sale → Selling, flag colors, auto-revert, feed visibility** *(DB migration 019 may already exist from S30 partial merge — check before creating)*
5. [x] **[REA-88] UX: cursor pointer on all clickable elements (global audit)**
6. [x] **[REA-75] Navigation: scroll position restoration on back**

---

## Pre-flight checks

Before starting, verify the current repo state:
1. `git log --oneline -3` — confirm we're on the S30 commit
2. `ls src/db/migrations/019*` — check if migration 019 already exists from S30's partial Cluster B merge
3. `grep -r "selling" web/src/lib/types.ts` — check if REA-73's type change already landed
4. If 019 migration and type changes exist, REA-73 may be partially done — verify all pieces before skipping

## NOT in scope
- REA-63: sync-db.sh (already Done, script is in repo)
- REA-13, REA-14, REA-12: features (deferred)
