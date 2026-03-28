# Realty Hub — Project Scope (Sessions 41–44)

**Created:** 2026-03-27
**Branch:** `main` (direct commits)
**⚠️ IMPORTANT:** Claude Code does NOT push or deploy. Commit locally, recommend message. Pavel deploys.

---

## 🔴 Session 41 — Filter UX + Status Fixes (pilot-blockers)

**Linear:** REA-112, REA-113, REA-115, REA-132, REA-129
**Goal:** Fix all broken filter inputs, status dropdown, ghost arrows, and title casing. These are pilot-blockers — agents cannot use the app effectively until these are resolved.

**⚠️ READ THIS FIRST:** For each task below, run `get_issue REA-XX` via Linear MCP to read the FULL spec before coding. The descriptions below are summaries only.

### Tasks (execute top-down)

* [x] **[REA-112] Filter UX fixes (11 sub-items)** — Price decimal input, stepper increment by 1.0, "tỷ" label outside input, clear 0.0 on focus, style consistency, listing count flicker, collapse on Apply, orange active indicator, back-button filter state, "X Listings" in map view, My Store map spacing. `pilot-blocker`
* [x] **[REA-113] Edit listing: status dropdown + auto price status + field reorder** — Hide just_listed/price_increased/price_dropped from dropdown (system-only). Auto-set price status on save (compare old vs new price_vnd). Field order: match New Listing form. Description textarea double height.
* [x] **[REA-115] Remove ALL ghost back arrow buttons (repo-wide)** — `grep -rn` for back/Back/chevron-left/ArrowLeft/← in web/src/ and remove all. Users rely on browser back.
* [x] **[REA-132] Standardized title: remove ALL CAPS** — Audit generateTitleStandardized(), DB values, regenerate-titles.sh, CSS text-transform. Grep repo-wide for uppercase/toUpperCase. Fix everywhere.
* [x] **[REA-129] Replace /dashboard/listings links with My Store** — grep for dashboard/listings, replace list route only (not individual /[id] routes). All "My Listings" navigation → My Store.

### End of session checklist
* [x] `cd web && npx tsc --noEmit` — must be clean
* [x] Verify grep for ghost back arrows returns zero
* [x] Verify grep for /dashboard/listings (list route) returns zero
* [x] Update `CLAUDE.md`: session counter
* [x] Write `docs/code_sessions/2026-03-27-session41-filter-status-fixes.md`
* [x] Update `docs/CHANGELOG.md`
* [ ] `git add -A && git commit -m "Session 41: Filter UX + status dropdown + ghost arrows + title casing"`
* [ ] Stop. Do not push.

---

## 🟡 Session 42 — Card Consistency + Visual Polish

**Linear:** REA-127, REA-125, REA-130, REA-124, REA-123, REA-126
**Goal:** Unify listing card appearance across all views. Standardize icons, agent info, and interactive elements.

**⚠️ READ THIS FIRST:** For each task, run `get_issue REA-XX` via Linear MCP to read the FULL spec before coding.

### Tasks (execute top-down)

* [x] **[REA-127] Card consistency overhaul (5 sub-items)** — Orange left border on 2-wide owned cards. Agent avatar + clickable name on 1-wide. Agent avatar on all cards + full listing. Bottom row: avatar+name | phone | message icon. Ward display "New / Old" + reduce 2-wide image height for iPhone 2x2 fit.
* [x] **[REA-125] Standardize message icon across all views** — Same bubble icon on 1-wide and 2-wide, Feed and My Store. Remove rectangular orange "Inquiries" button. Consistent icon, size, position.
* [x] **[REA-130] Map popup cleanup (3 fixes)** — Remove extra empty lines. Remove redundant dark grey block. Add compact agent info row (avatar, name, phone, message).
* [x] **[REA-124] Heart favorite: top-right of photo in single-wide cards** — Standardize position across Feed, My Listings, My Favorites.
* [x] **[REA-123] Heart favorite on full listing photo** — Add FavoriteButton to top-right of main photo on listing detail page.
* [x] **[REA-126] Edit button repositioning** — 1-wide: middle-right of card. 2-wide: middle-right of info section. Owner-only.

### End of session checklist
* [ ] `cd web && npx tsc --noEmit` — must be clean
* [ ] Visually verify: open Feed in 1-wide, 2-wide, map. Check card consistency.
* [ ] Update `CLAUDE.md`, session log, CHANGELOG
* [ ] Commit: `Session 42: Card consistency + visual polish`
* [ ] Stop. Do not push.

---

## 🟡 Session 43 — Ward Mapping + Layout + Navigation

**Linear:** REA-128, REA-122, REA-121, REA-131
**Goal:** Fix ward cascading behavior, header spacing, button placement, and profile title display.

**⚠️ READ THIS FIRST:** For each task, run `get_issue REA-XX` via Linear MCP to read the FULL spec before coding.

### Tasks (execute top-down)

* [x] **[REA-128] Ward mapping overhaul** — Audit nha_trang_wards table vs REA-67 seed data. Fix cascading dropdown behavior (old↔new ward). Ward display on cards: "New Ward / Old Ward". Verify search indexes include ward. End-to-end test: create → feed → filter by ward.
* [x] **[REA-122] FIDT header to listing title spacing** — Consistent pt-4 / LAYOUT.CONTENT_TOP_PADDING on all listing detail pages regardless of ownership.
* [x] **[REA-121] Move Edit/Create Post below Prev/Next** — Reposition action buttons below navigation on full listing detail. Edit hidden for non-owners.
* [x] **[REA-131] Profile My Listings: standardized title** — Two-line title per ADR-005. Line 1 = street, Line 2 = title_standardized. No ward in title, no address_raw.

### End of session checklist
* [x] `cd web && npx tsc --noEmit` — must be clean
* [ ] Verify ward cascading: select old ward → new ward auto-fills, and vice versa
* [x] Update `CLAUDE.md`, session log, CHANGELOG
* [ ] Commit: `Session 43: Ward mapping + layout + navigation fixes`
* [ ] Stop. Do not push.

---

## 🟡 Session 44 — Infrastructure: Dev/Prod + E2E Testing

**Linear:** REA-133, REA-134
**Goal:** Establish clear environment separation and automated testing foundation. After this session, Claude Code works exclusively in dev and every session runs E2E tests before declaring done.

**⚠️ READ THIS FIRST:** For each task, run `get_issue REA-XX` via Linear MCP to read the FULL spec before coding.

### Tasks (execute top-down)

* [ ] **[REA-133] Dev/Prod environment separation** — Rename deploy-vm.sh → deploy-prod.sh (keep symlink). Create deploy-dev.sh for local Docker. Split .env into .env.development + .env.production. Add ## Environment section to CLAUDE.md. Docker Compose profiles or override file.
* [ ] **[REA-134] Playwright E2E foundation** — Install @playwright/test. Create web/e2e/ with 5 smoke tests: auth login, feed loads, filters apply + back-button preserves, create listing, messaging. Add `npx playwright test` to session close checklist in CLAUDE.md. Run tests, confirm all pass.

### End of session checklist
* [ ] `cd web && npx tsc --noEmit` — must be clean
* [ ] `cd web && npx playwright test` — all 5 smoke tests pass
* [ ] Verify deploy-dev.sh starts local stack successfully
* [ ] Verify deploy-prod.sh exists (renamed from deploy-vm.sh)
* [ ] Verify .env.development and .env.production exist with correct values
* [ ] Update `CLAUDE.md`: add Environment section, add Playwright to session checklist
* [ ] Session log + CHANGELOG
* [ ] Commit: `Session 44: Dev/Prod separation + Playwright E2E foundation`
* [ ] Stop. Do not push.

---

## 📋 Quality Rules (apply to ALL sessions above)

1. **Claude Code does NOT mark issues Done in Linear.** It marks `[x]` in this SCOPE file. Pavel verifies after deploy and marks Done in Linear.
2. **No self-grading visual bugs.** If a fix involves visual changes, note it for Pavel to verify post-deploy. Do not assume it looks correct.
3. **Regressions caught in prior sessions that persist:** Before declaring fixed, grep the repo for the pattern and verify at the code level — do not just test the happy path.
4. **Sequential execution only.** No subagents, no worktrees. One task at a time, top-down.
5. **If stuck >15 min on a single item:** Skip it, note the blocker in the session log, move to the next task.

---

## 🗂️ Backlog (do not execute — future sessions)

* **REA-110** — Saved Searches (Done, needs QA)
* **REA-109** — Vietnamese price notation (Done, needs QA)
* Photo upload: HEIC conversion, thumbnails (REA-9)
* Photo: primary photo selection (REA-10)
* Gemini parse: improved Vietnamese prompts (REA-11)
* Listing export: share card v2 refinements
* GCS photo migration (from local disk)
* CI/CD: GitHub Actions pipeline
