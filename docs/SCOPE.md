# Realty Hub — Project Scope
**Sprint:** Post-Pilot Bug Fixes + Polish
**Phase:** Iterating on pilot feedback (Session 24–25 testing)
**Version:** v1.1-polish

---

## 🔴 Current Session: 25b — Hotfixes for S25 Deploy Issues + Title Zombie Kill

**Branch:** `main` (direct commits)
**Linear:** REA-51, REA-53 through REA-64
**ADR:** ADR-005 (supersedes ADR-002 Decision 1) — title_standardized canonical format + single-source rendering
**Goal:** Fix deploy infra issues from S25, definitively kill the title_standardized zombie, fix remaining P0 bugs from pilot feedback.

### Tasks (execute top-down — infra first, then P0, then P1/P2)

#### Infra fixes (do these FIRST)

* [x] **[Infra: schema_migrations + script permissions — REA-64]**
    1. In `migrate.sh`, add self-healing at top: `ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS description TEXT;`
    2. Run `git update-index --chmod=+x scripts/regenerate-titles.sh` (and any other .sh files missing +x)
    3. In `deploy-vm.sh`, add `chmod +x scripts/*.sh` at top of both full and update modes
    4. Verify deploy completes cleanly with no permission errors

* [x] **[Docs: CLAUDE.md updates — REA-62]** Add three sections:
    1. Deployment reminder: deploy-vm.sh handles migrations, never suggest manual migration
    2. ADR reading rules: ADRs are historical, don't read during execution, newest-to-oldest when needed
    3. Script permissions: all new .sh files must use `git update-index --chmod=+x`

#### P0 — Title zombie kill (READ ADR-005 FIRST)

* [x] **[P0: title_standardized nuclear fix — REA-57]** ROOT CAUSE: Three card components have inline `buildSpecsLine()` functions that bypass `generateTitleStandardized()` and hardcode the OLD format (`m²`, `T`, `x`, commission before price).
    1. **DELETE** `buildSpecsLine()` from `web/src/components/feed/FeedCard.tsx`
    2. **DELETE** `buildSpecsLine()` from `web/src/components/ui/ListingCard.tsx`
    3. **DELETE** inline `line2Parts` builder from `web/src/components/listings/ListingCard.tsx`
    4. In ALL three components, replace with: `const line2 = listing.title_standardized || generateTitleStandardized(listing);`
    5. Import `generateTitleStandardized` from `@/lib/constants` in each file
    6. Verify `generateTitleStandardized()` in constants.ts is correct (no suffixes, price before commission) — it should already be right
    7. Ensure `scripts/regenerate-titles.sh` runs on deploy and recomputes all DB rows
    8. Verify: no `m²`, no `T`, no `x`, no ward in any title on Feed, My Listings, or listing detail

* [x] **[P0: Listing detail header — REA-61]** The listing detail page shows title_standardized as a separate block below address. Fix:
    1. Merge into ONE block: Line 1 = address_raw (normal size), Line 2 = title_standardized (large bold)
    2. Remove the standalone title_standardized block that currently shows below
    3. Remove the broken price block (large VND + USD + small VND)
    4. Layout: two-line title block → photos → description → property details → map → agent → messages

#### P0 — Other pilot-blocking bugs

* [x] **[P0: Map height + bottom nav — REA-60]** Map STILL overlaps bottom nav. Fix height calculation. Bottom nav `fixed bottom-0` on ALL pages.

* [x] **[P0: Feed message routing — REA-53]** All Feed "View Messages" / "Message Agent" buttons → `/dashboard/listings/[id]/view?from=feed#messages`. Remove ALL paths to old `/dashboard/messages/[convId]` from Feed.

* [x] **[P0: Conversation scroll — REA-54]** Scroll to latest message, NOT property header. Agent info must be visible at top.

* [x] **[P0: Conversation header redesign — REA-55]** Two bars:
    - Bar 1 (Agent): Avatar, Name, email, WhatsApp/Zalo/Phone icons — clickable → agent profile
    - Bar 2 (Property): Thumb, address, specs — clickable → listing detail
    - Remove "Archive" button and all duplicate property info.

#### P1

* [x] **[Duplicate photos — REA-58]** View mode = carousel only. Manage photos = edit mode only.

* [x] **[Feed header + city selector — REA-59]** "Listings Feed" header + city dropdown (Nha Trang default). Migration already applied (S25). Wire up `?city=` filter in Feed API.

#### P2

* [x] **[Message icon consistency — REA-56]** Message bubble icon everywhere.
* [ ] **[VM cleanup — REA-51]** Remove `~/re-nhatrang/` from VM.

---

## ✅ Completed (Session 25 — partial)

* [x] REA-59 migration: `city` column added to `parsed_listings` with default 'Nha Trang'
* [x] REA-57 partial: `generateTitleStandardized()` in constants.ts is correct, `regenerate-titles.sh` created (but deploy failed on permissions — fixed manually on VM)

## ✅ Completed (Session 24)

* [x] REA-41 through REA-50 (all 10 items)

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
* [ ] DB sync script — REA-63
* [ ] Listing form field ordering + city field in forms (next sprint)
