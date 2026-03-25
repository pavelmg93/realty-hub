# Multi-Session SCOPE — S32 through S35

**For each task, run `get_issue REA-XX` via Linear MCP to read the full spec before coding.**

> **⚠️ NO SUBAGENTS. Execute all tasks SEQUENTIALLY.**
> **After each session block: commit, create session log, update CHANGELOG, recommend commit message, then STOP.**
> **Do NOT continue to the next session block. User will push, deploy, test, and restart.**

---

## Session 32 — Docs + Quick UI Fixes (low risk, warm-up)

1. [x] **[REA-92] Docs: update all references from Next.js 15 → 16.1.6** — grep repo, update CLAUDE.md, ARCHITECTURE.md, README.md, add Suspense rule to Design Rules
2. [x] **[REA-95] Grid 1w/2w / Map buttons always visible** — toolbar strip (Search, Filter, Grid toggles, Map) must not change when switching view mode
3. [x] **[REA-99] 1-wide card needs larger fonts** — maximize horizontal/vertical space, larger title, larger agent info
4. [x] **[REA-94] Listing in Map View — title fix** — map popups should use mini listing card with standardized two-line title

**After completing S32: commit, session log, STOP.**

---

## Session 33 — Search + Feed Sorting (DB migration session)

1. [x] **[REA-96] Search has to work now** — tsvector + GIN index, unaccent extension, wire to /api/feed and /api/listings, debounced UI. Supersedes REA-13.
2. [x] **[REA-98] Feed auto-groups by flag** — just_listed first (by date), then price changes, then selling. Hide deposit/sold/not_for_sale unless favorited.
3. [x] **[REA-93] Google Maps link in and out** — "Open in Google Maps" button on listing detail, paste Google Maps link field on add/edit form to extract lat/lng

**After completing S33: commit, session log, STOP.**

---

## Session 34 — My Store + Listing Export (feature session)

1. [ ] **[REA-97] My Store = My Listings + Favorites** — center bottom nav button "My Store" with two tabs: My Listings, My Favorites
2. [ ] **[REA-14] Listing export: share card image + copy text v1** — generate 1080×1350 share image, one-click copy formatted text for Zalo/Facebook
3. [ ] **[REA-12] Gemini parse: image/screenshot OCR parsing** — upload screenshot → Gemini Vision extracts text → parse fields

**After completing S34: commit, session log, STOP.**

---

## Session 35 — Infrastructure (if time permits)

1. [ ] **[REA-21] API rate limiting** — rate limit all API endpoints
2. [ ] **[REA-18] Migrate photo storage to GCS** — presigned URLs for upload/download
3. [ ] **[REA-20] Notification system** — new messages, new listings in agent's area, FCM push

**After completing S35: commit, session log, STOP.**

---

## Excluded (manual / blocked)

- REA-8: Create 10 pilot accounts — needs names from FIDT, manual on VM

---

## Rules for unattended execution

1. **Sequential only.** No subagents, no worktrees.
2. **Commit after each session block.** Do not batch across sessions.
3. **Stop after each block.** Print "Session NN complete. Recommended commit: ..."
4. **If a task fails or seems risky,** skip it, add a comment on the Linear issue, and move to the next task. Do not block the session.
5. **TypeScript must be clean** (`cd web && npx tsc --noEmit`) before committing.
6. **Do NOT push.** User handles push and deploy.
