# Realty Hub — Project Scope
**Sprint:** Post-Pilot Bug Fixes + Polish
**Phase:** Iterating on pilot feedback (Session 24 testing)
**Version:** v1.1-polish

---

## 🔴 Current Session: 25 — Critical Bug Fixes + Listing Detail Cleanup

**Branch:** `main` (direct commits)
**Linear:** REA-51, REA-53 through REA-62
**Goal:** Fix P0 regressions from Session 24 (title_standardized, map overlap, listing detail layout), clean up conversation thread headers, unify message routing from Feed.

### Tasks (execute top-down — P0 first, then P1, then P2)

#### P0 — Pilot blockers

* [x] **[P0: title_standardized nuclear fix — REA-57]** The `title_standardized` column STILL contains `m²` suffixes and ward names despite 3 prior fix attempts. Regex-patching has failed.
    1. Audit codebase: `grep -rn "m²\|m2" web/src/` — find all injection points
    2. Audit DB: `SELECT id, title_standardized FROM parsed_listings;` — inspect actual values
    3. Rewrite `generateTitleStandardized()` with canonical spec:
       - Input: `area_m2`, `num_floors`, `frontage_m`, `depth_m`, `price_short`, `commission`
       - Output: `<area> <floors> <frontage> <depth> <price> <commission>`
       - NO suffixes (m², T, x), NO ward, NO address, NO property type
       - Null fields omitted silently
    4. Create `scripts/regenerate-titles.ts` (or .js) — reads all parsed_listings, calls `generateTitleStandardized()` for each row, UPDATEs the DB. This is NOT a SQL migration — it's a Node script that uses the same function the app uses.
    5. Add `scripts/regenerate-titles` call to `deploy-vm.sh update` after migrate.sh — titles are regenerated on every deploy.
    6. Ensure listing create AND edit both recompute `title_standardized` from source columns on save.
    7. Verify: `SELECT title_standardized FROM parsed_listings WHERE title_standardized LIKE '%m²%' OR title_standardized LIKE '%Loc Tho%' OR title_standardized LIKE '%Vinh%';` returns 0 rows.

* [x] **[P0: Map height + bottom nav — REA-60]** Map view STILL overlaps bottom nav (desktop) and pushes it off viewport (mobile). Session 24 fix (`calc(100vh - 200px)`) insufficient.
    1. Measure actual component heights (topbar, toolbar, bottom nav)
    2. Set map height to `calc(100vh - topbar - toolbar - bottomnav)`
    3. Bottom nav must use `fixed bottom-0` and be visible on ALL pages at ALL times
    4. Test on desktop narrow viewport AND mobile

* [x] **[P0: Listing detail layout — REA-61]** Remove the broken price block (large VND + USD + small VND). Enforce layout: standardized title (2 lines, same as thumbnails) → photos → description → property details → map → agent → messages.

* [x] **[P0: Feed message routing — REA-53]** All "View Messages" / "Message Agent" buttons in Feed must route to `/dashboard/listings/[id]/view?from=feed#messages`. Remove ALL paths to old `/dashboard/messages/[convId]` from Feed components.

* [x] **[P0: Conversation scroll — REA-54]** Fix auto-scroll in `/dashboard/messages/[conversationId]` — should scroll to latest message, NOT to property header. Agent info must be visible at top.

* [x] **[P0: Conversation header redesign — REA-55]** Redesign the two header bars:
    - Bar 1 (Agent): `[Avatar] Name | email | WhatsApp | Zalo | Phone+number` — entire bar clickable → agent profile
    - Bar 2 (Property): `[Thumb] address | specs` — clickable → listing detail
    - Remove "Archive" button. Remove all duplicate property info.

#### P1 — Important fixes

* [x] **[Duplicate photos — REA-58]** View mode shows carousel ONLY. "Manage Photos" only appears in edit mode. Never show photos twice on same page.

* [x] **[Feed header + city selector — REA-59]** Add "Listings Feed" header matching My Listings style. Add city dropdown (Nha Trang default, Hanoi, Saigon, Da Nang). Migration: add `city VARCHAR(100) DEFAULT 'Nha Trang'` to `parsed_listings`, backfill all existing rows. Feed API: filter by `?city=`. Do NOT add city to listing forms yet.

#### P2 — Polish

* [x] **[Message icon consistency — REA-56]** Use message bubble icon everywhere for "View Messages". Remove eyeball icon.

* [x] **[CLAUDE.md deployment reminder — REA-62]** Add section: `deploy-vm.sh update` handles migrations. Never suggest manual migration. End-of-session: git push → VM: git pull && deploy-vm.sh update.

* [ ] **[VM cleanup — REA-51]** Remove stale `~/re-nhatrang/` directory from VM.

---

## ✅ Completed (Session 24)

* [x] REA-41: Avatar rendering in feed/detail/threads
* [x] REA-42: Title commission/price order swap
* [x] REA-43: Title font size in listing detail
* [x] REA-44: Listing detail linearized (removed tabs)
* [x] REA-45: Map mobile touch + height (partial — reopened as REA-60)
* [x] REA-46: Filter chips removed from My Listings
* [x] REA-47: Unified toolbar Feed + My Listings
* [x] REA-48: Sticky conversation headers
* [x] REA-49: Embedded messages in listing detail
* [x] REA-50: Mobile zoom disabled

---

## 🧊 Backlog (not this sprint)

* [ ] Migrate photos to GCS — REA-18
* [ ] Notifications — REA-20
* [ ] API rate limiting — REA-21
* [ ] JWT expiry + refresh tokens
* [ ] Cloud Run / Cloud SQL migration
* [ ] CRM: person profile docs + deal events
* [ ] pgvector semantic search
* [ ] Public listing pages (`/l/[id]?token=xxx`)
* [ ] Upgrade Cloudflare SSL to "Full (Strict)" with origin cert
* [ ] Feed FTS — REA-13
* [ ] Share card image generator — REA-14
* [ ] Gemini image/OCR parsing — REA-12
* [ ] Create pilot accounts — REA-8
* [ ] Listing form field ordering + city field in forms (next session after 25)
