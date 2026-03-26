# Session 36 — Audit + Fix Pass (S32-S35 Verification)

**Date:** 2026-03-26

**For each task, run `get_issue REA-XX` via Linear MCP to read the full spec before coding.**

> **⚠️ NO SUBAGENTS. Execute all tasks SEQUENTIALLY.**
> **This is a verification + fix session.** Claude Code ran S32-S35 without Linear MCP.
> For each issue below, READ the Linear spec, COMPARE against what's in the code, and FIX any gaps.

---

## Part 1 — Audit S32-S35 issues (verify and fix)

For each issue: `get_issue REA-XX`, read spec, verify code matches spec, fix if not.

### S32 (UI Polish)
* [x] **[REA-95] Verify: Grid buttons always visible** — check feed + listings pages
* [x] **[REA-99] Verify: 1-wide card fonts** — check both ListingCard components
* [x] **[REA-94] Verify: Map popup titles** — check FeedMap popup rendering

### S33 (Search + Feed + GMaps)
* [x] **[REA-96] Verify: Full-text search** — check migration 020, API routes, test search locally
* [x] **[REA-98] Verify: Feed auto-groups by flag** — check ORDER BY in feed API
* [x] **[REA-93] Verify: Google Maps in/out** — check detail view link + form paste field

### S34 (My Store + Share + OCR)
* [x] **[REA-97] Verify: My Store page** — check /dashboard/store, bottom nav, tabs
* [x] **[REA-14] Verify: Share card image** — check share-card.ts, download button
* [x] **[REA-12] Verify: Screenshot OCR** — check Gemini Vision call, UI button

### S35 (Infra)
* [x] **[REA-21] Verify: Rate limiting** — check middleware, rate-limit.ts
* [x] **[REA-20] Verify: Notifications** — check migration 021, API, TopBar bell, notifications page (NOTE: FCM push not implemented, in-app only)

---

## Part 2 — New issues from testing

* [x] **[REA-100] Filters display update** — hide Legal, Price Min-Max at top and bigger, Bedrooms & Bathrooms, Area Min-Max, Ward Old & New

---

## Rules

1. For each audit item: read Linear spec → check actual code → if mismatch, fix it
2. If something works correctly, skip it — don't rewrite working code
3. Log any issues found as Linear comments on the relevant issue
4. At end, create session log with what was verified vs what was fixed
