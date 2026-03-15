# ProMemo — Project Scope & Action Hub
**Session 14 · 2026-03-16 · Picking up from AntiGravity handoff**

---

## 🎯 Current Milestone: Session 14 — Listing Form Rebuild & Schema Consistency Pass

**Objective:** Eliminate the two critical server errors blocking basic listing workflow (Add + Edit), rebuild the New Listing form against the full `parsed_listings` schema with inline AI parse, rebuild My Listings to match Stitch mockups, and add the five schema/UI improvements (favorites, title_standardized, commission, status expansions, i18n pass).

---

## 🚀 Next Actions (Immediate execution)

### P0 — Bugs (unblock before anything else)
* [x] **[API: listings POST]** Fixed — root cause was `description_vi` and `description_en` ghost columns in INSERT SQL that don't exist in DB. Removed from POST, PUT, validation, types.
* [x] **[API: listings PUT]** Fixed — same root cause as POST. Removed ghost columns.
* [x] **[DB: migration 011]** Applied `011_drop_old_status_constraint.sql` — dropped overlapping `ck_parsed_listings_status`. `title_standardized` and `commission` already existed (added by earlier sessions). SCHEMA.md updated to level 011.

### P1 — New Listing Form Rebuild
* [x] **[UI: New Listing]** Already built by Cursor/AntiGravity — has AI parse textarea + form sections + DatabaseView. Works end-to-end after P0 fix.
* [x] **[UI: Description block]** Freeflow textarea + "Parse with AI" button already implemented. Mock parser extracts price, area, ward, floors, street, property type.
* [x] **[UI: Create Listing button]** Works — INSERTs into `parsed_listings`, redirects to My Listings.
* [x] **[API: `/api/ai/parse-listing`]** Route exists with mock regex parser. Ready for Gemini upgrade when key is configured.

### P2 — My Listings Rebuild
* [x] **[UI: My Listings]** Already built — grid 1/2/3 toggle, map toggle, status filter tabs (All / Active / Under Contract / Sold / Archived), search bar, filters panel, orange ring on own cards.
* [x] **[Schema parity]** Feed and My Listings share FeedFilters component with same filter set. Feed adds Agent filter.

### P3 — Schema & Status Improvements
* [x] **[DB: migration 011]** Dropped old constraint. New constraint includes all 9 statuses. Added `in_negotiations` and `pending_closing` to Zod validation enum.
* [x] **[UI: StatusBadge]** Updated with all 9 statuses including `in_negotiations` and `pending_closing`. Shows on all listing cards.
* [x] **[Logic: title_standardized]** Already implemented in `web/src/lib/constants.ts` → `generateTitleStandardized()`. Auto-generated on INSERT/UPDATE.

### P4 — Feed: Favorites
* [x] **[UI: FeedCard]** Heart icon on every ListingCard with optimistic toggle. Uses lucide-react Heart icon.
* [x] **[API: `/api/listings/[id]/favorite`]** Rebuilt as simple toggle (POST) + status check (GET). No request body needed.
* [x] **[UI: FeedFilters]** "Favorites Only" checkbox already in filter panel. Feed API supports `is_favorited=true`.

### P5 — i18n Pass
* [x] **[i18n]** Added `inNegotiations` key to en + vi. All other keys were already present from Cursor/AntiGravity work.

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