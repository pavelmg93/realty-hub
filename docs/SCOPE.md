# Sessions 37-39 — Bug Fixes + UI Redesign + Features

**Date:** 2026-03-26

**For each task, run `get_issue REA-XX` via Linear MCP to read the full spec before coding.**

> **⚠️ NO SUBAGENTS. Execute all tasks SEQUENTIALLY.**
> **Commit after each session block. Do NOT continue to next block without user push/deploy.**

---

## Session 37 — Critical Bug Fixes

1. [x] **[REA-104] P0: Search flickering, partial matches, should fire on Enter only** — remove debounce, Enter-only search, verify tsvector whole-word matching, remove ILIKE fallback
2. [x] **[REA-103] Bug: Screenshot OCR (Gemini Vision) does not work** — debug API route, check base64 handling, test locally
3. [x] **[REA-102] Bug: Google Maps paste doesn't update map pin + support goo.gl links** — wire extracted coords to Leaflet map re-render, handle short URL redirect
4. [x] **[REA-108] Map popup redesign** — mini card with clickable photo, dark theme, no white borders, remove "View Details" link

**After completing S37: commit, session log, STOP.**

---

## Session 38 — UI Redesign (navigation + view mode)

1. [x] **[REA-106] View mode: 3-state toggle (1-wide / 2-wide / Map)** — single segmented control, orange highlight on active, remove standalone Grid button. Apply to Feed, My Store, everywhere.
2. [x] **[REA-107] Bottom nav rearrange** — News (placeholder), My Store, Feed (center), CRM (with Messages as first tab), Profile
3. [x] **[REA-105] My Store: add search, filters, and view mode selector** — same toolbar as Feed
4. [x] **[REA-100] Filters display update** — hide Legal, Price Min-Max at top and bigger, Bedrooms/Bathrooms, Area Min-Max, Ward Old/New

**After completing S38: commit, session log, STOP.**

---

## Session 39 — Features (CRM + pricing + saved searches)

1. [x] **[REA-109] Price filter: accept Vietnamese notation** — parse "2ty", "400tr", "900trieu", convert to VND for SQL
2. [x] **[REA-110] Saved Searches** — save filters + search text, attach Buyers/Sellers, quick-create Person, accessible from CRM
3. [x] **[REA-101] Saved Searches w/wo Buyer association** — duplicate of REA-110, consolidated

**After completing S39: commit, session log, STOP.**

---

## Rules for unattended execution

1. **Sequential only.** No subagents, no worktrees.
2. **Commit after each session block.** Do not batch across sessions.
3. **Stop after each block.** Print "Session NN complete. Recommended commit: ..."
4. **If a task fails or seems risky,** skip it, add a comment on the Linear issue, move on.
5. **TypeScript must be clean** before committing.
6. **Do NOT push.** User handles push and deploy.
7. **READ Linear issue specs via MCP before coding each task.**
