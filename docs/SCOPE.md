# Session 28 — Map/Layout Escalation + Quick Fixes

**Date:** 2026-03-24
**Focus:** Map mode definitive fix (5th attempt — ESCALATED), listing detail map overlap, separate view mode storage

> **⚠️ ESCALATION PROTOCOL — READ BEFORE CODING ⚠️**
> REA-79 has failed 4 prior times (REA-45, REA-60, REA-70, REA-77). Before writing ANY map-related code:
> 1. Run the grep commands listed in REA-79
> 2. Paste the full output as a comment on REA-79
> 3. Trace the actual rendered JSX for map mode in both feed and listings pages
> 4. Only THEN propose a fix

**For each task, run `get_issue REA-XX` via Linear MCP to read the full spec before coding.**

---

## Session Scope (3 issues)

* [ ] **[REA-79] P0 ESCALATED: Map mode — width, height, header, mobile viewport**
  - Map must use `max-w-3xl mx-auto` like grid (not full-width)
  - Header ("Listings Feed" + city selector) must stay visible in map mode
  - Use `100dvh` not `100vh` for mobile browser chrome
  - Desktop: cap map height at ~500px; Mobile: fill between toolbar and bottomnav
  - Update `layout-constants.ts` with new MAP_HEIGHT using `min()` and `dvh`
  - **MUST grep before coding. MUST screenshot-verify before marking Done.**

* [ ] **[REA-80] Bug: Listing detail Leaflet map overlaps FIDT header**
  - Map in listing view should be fixed height (`h-48` or `h-56`), not viewport-relative
  - Container: `overflow-hidden rounded-lg z-0`
  - Must not use position absolute/fixed

* [ ] **[REA-81] Feed and My Listings separate stored view mode**
  - Split `realtyhub_view_mode` → `realtyhub_feed_view_mode` + `realtyhub_listings_view_mode`
  - Trivial 2-file change

---

## Key files to modify

- `web/src/lib/layout-constants.ts` — update MAP_HEIGHT formula
- `web/src/app/dashboard/feed/page.tsx` — map container, header visibility, localStorage key
- `web/src/app/dashboard/listings/page.tsx` — same as feed
- `web/src/app/dashboard/listings/[id]/view/page.tsx` — listing detail map height + z-index
- `web/src/components/map/DynamicFeedMap.tsx` — may need height prop changes
- `web/src/components/map/DynamicListingMap.tsx` — listing detail map component

---

## NOT in scope (backlogged for S29+)

- REA-82: Edit listing margins
- REA-83: Card/view polish (duplicate flags, listing ID, status on view, i18n flags)
- REA-84: Message button icon-only + agent info in embedded messages
- REA-72: Add/Edit form fixes
- REA-73: Status system (rename For Sale → Selling, colors, auto-revert)
- REA-71: Embedded messages "No messages yet" bug
