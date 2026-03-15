# ProMemo — Project Scope & Action Hub
**Session 14 · 2026-03-16 · Picking up from AntiGravity handoff**

---

## 🎯 Current Milestone: Session 14 — Listing Form Rebuild & Schema Consistency Pass

**Objective:** Eliminate the two critical server errors blocking basic listing workflow (Add + Edit), rebuild the New Listing form against the full `parsed_listings` schema with inline AI parse, rebuild My Listings to match Stitch mockups, and add the five schema/UI improvements (favorites, title_standardized, commission, status expansions, i18n pass).

---

## 🚀 Next Actions (Immediate execution)

### P0 — Bugs (unblock before anything else)
* [ ] **[API: listings POST]** Reproduce + fix "Add Listing" server error — likely column mismatch between INSERT statement and current migration-010 schema (Session 13 introduced `title_standardized`, `commission`, possibly `avatar_url`). Run `cd web && npx tsc --noEmit` first to surface type errors.
* [ ] **[API: listings PUT]** Reproduce + fix "Edit Listing" server error — same root cause as above; verify column list in `PUT /api/listings/[id]` matches schema exactly.
* [ ] **[DB: migration 011]** Write and apply `src/db/migrations/011_title_commission.sql`: add `title_standardized VARCHAR(500)` and `commission VARCHAR(50) DEFAULT 'hh1'` to `parsed_listings`. Update `SCHEMA.md` to migration level 011.

### P1 — New Listing Form Rebuild
* [ ] **[UI: New Listing]** Rebuild `/dashboard/listings/new` inspired by `stitch_property_details_view/add_new_listing_form`. Sections: Basic Info, Location + Map pin, Price & Area, Property Details, Description block, Photos, Documents.
* [ ] **[UI: Description block]** Add freeflow textarea + **"Parse with AI"** button: (1) INSERT into `raw_listings`, (2) call Python parser subprocess, (3) call Gemini API, (4) prefill form fields with extracted data + confidence indicators, (5) stage a `parsed_listings` row.
* [ ] **[UI: Create Listing button]** Final form submit: INSERT confirmed row into `parsed_listings` (promote staged row or direct insert). Redirect to Full Listing View on success.
* [ ] **[API: `/api/ai/parse-listing`]** Create route — accepts `{ text, photos? }`, calls Gemini 1.5 Flash, returns structured fields + confidence + follow-up questions. See ROADMAP-v2 §2.3 for full response schema.

### P2 — My Listings Rebuild
* [ ] **[UI: My Listings]** Rebuild `/dashboard/listings` to match `stitch_property_details_view/my_listings_management`: grid 1/2/3 toggle, map toggle, status filter tabs (Just Listed / For Sale / Price Dropped / etc.), owner orange left border on cards, Inquiries link per card.
* [ ] **[Schema parity]** Audit FeedFilters vs. My Listings filters vs. New Listing form fields — all three must expose the same `parsed_listings` columns. Feed adds Agent filter; My Listings omits it (defaults to current user).

### P3 — Schema & Status Improvements
* [ ] **[DB: migration 011]** (same migration as above) Add `just_listed`, `price_dropped`, `price_increased` to the `status` CHECK constraint (already in schema enum per SCHEMA.md — verify they exist in the DB constraint, add if missing).
* [ ] **[UI: StatusBadge]** Show status badge on listing thumbnails for all statuses **except** `for_sale`. Order: Just Listed → For Sale → Price Dropped → Price Increased → Deposit → Sold → Not for Sale.
* [ ] **[Logic: title_standardized]** Auto-generate on INSERT/UPDATE in the API route: `<address_raw> <area_m2> <num_floors> <frontage_m>x<depth_m> <price-short> <commission>`. Helper function in `web/src/lib/listing-utils.ts`.

### P4 — Feed: Favorites
* [ ] **[UI: FeedCard]** Add heart icon-button to each listing thumbnail. Toggle calls `POST /api/listings/[id]/favorite`. Uses `listing_favorites` table (already in schema/migration).
* [ ] **[API: `/api/listings/[id]/favorite`]** POST toggles; GET returns current state. Verify `listing_favorites` table exists post-migration-010.
* [ ] **[UI: FeedFilters]** Add "Favorites only" toggle to filter panel. Feed API: accept `favorites_only=true` param, JOIN `listing_favorites` on current agent.

### P5 — i18n Pass
* [ ] **[i18n]** After P1–P4 are stable: audit all new UI strings, add missing keys to `web/src/lib/i18n.ts`, confirm Vietnamese translations are correct across Feed, My Listings, New Listing, Full Listing, CRM pages.

---

## ⏳ Waiting On (Blocked)

* [ ] **[Stitch mockups]** Access to `stitch_property_details_view/` directory — needed for P1 (New Listing) and P2 (My Listings). Confirm files are present in repo before starting those tasks.
* [ ] **[GEMINI_API_KEY]** Must be set in `.env` / VM environment before the AI parse route can be tested end-to-end.

---

## 🧊 Backlog (Upcoming, not active this session)

* [ ] **[CRM]** Person profile: document uploads + interaction history log (deal_events) per ROADMAP-v2 §3.
* [ ] **[CRM: Deals]** Pre-populate 2–3 seed deals in different stages for demo walkthrough.
* [ ] **[Messaging]** Property context bar in thread (Session 12 partial) — verify working after schema alignment.
* [ ] **[Auth]** JWT expiry + refresh tokens before any public URL goes live (7-day expiry minimum).
* [ ] **[Deployment]** GCP Cloud Run / Cloud SQL migration from VM docker-compose — post-demo-stabilization.
* [ ] **[Photos: R2]** Migrate `./uploads/` to Cloudflare R2 presigned URLs for production photo storage.
* [ ] **[Agent avatars]** `avatar_url` on agents table + upload flow (flagged in Session 12).

---

## 🌌 Someday / Maybe

* [ ] Re-enable Kestra + Python scraping pipeline for bulk listing ingestion (post-demo).
* [ ] pgvector semantic search on listing descriptions.
* [ ] Push notifications (FCM) for new messages and deal stage changes.
* [ ] Auto-post to Zalo / TikTok / LinkedIn via MCP (scaffolded in Full Listing View).
* [ ] Public listing pages (`/l/[id]?token=xxx`) for client sharing without login.
* [ ] Analytics dashboard — deal conversion rates, listing performance (BigQuery post-MVP).

---

## 📋 Known Tech Debt (fix opportunistically)

| Issue | Priority | Notes |
|---|---|---|
| BIGINT as string from node-postgres | High | Always `parseInt(row.price_vnd) \|\| null` — add shared `coerceBigInt` helper to `lib/db.ts` if not already there |
| Turbopack stale 404s in dev | Low | `rm -rf web/.next` as workaround; consider `--turbo` flag audit |
| Two overlapping CHECK constraints on `parsed_listings.status` | Medium | Legacy constraint still present — verify new one is authoritative, drop old one in migration 011 |
| `cho_thue` → `ban` data fix (migration 005) | Done | Verify applied on GCP VM DB |