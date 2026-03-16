# ProMemo — Project Scope & Action Hub
**Session 15 · 2026-03-16 · UI Polish, Gemini Integration, i18n Fix**

---

## 🎯 Current Milestone: Session 15 — Listing UI Polish + Gemini AI Parse + i18n Cleanup

**Objective:** Bring New Listing and My Listings pages to Stitch quality with photos/docs,
wire up real Gemini parsing, fix card display (title_standardized + status badges),
enforce Feed visibility rules, fix all dropdown i18n gaps, and restore agent header
in conversation threads.

---

## 🚀 Next Actions (Immediate execution)

### P0 — Wrap Session 14 First
* [x] **[Housekeeping]** Session 14 logged and committed.

### P1 — Conversation Thread Regression
* [x] **[UI: MessageThread header]** Verified — already working. `GET /api/conversations/[id]`
  returns `other_agent_name`, `other_agent_id`, `other_agent_avatar_url`. Header renders
  agent name + initials avatar circle. `avatar_url` column added in migration 010.

### P2 — New Listing Form: Photos + Remove Dead Button
* [x] **[UI: New Listing — remove "Parse Text"]** Removed FreestyleEditor + dead `handleParse`
  (called non-existent `/api/parse`). Replaced with simple description textarea.
* [ ] **[UI: New Listing — Photos]** PhotoUploader staging mode — deferred.
* [ ] **[UI: New Listing — Documents]** DocumentManager staging mode — deferred.

### P3 — My Listings: Card UX
* [x] **[UI: ListingCard — photo thumbnail]** Added `primary_photo` + `photo_count`
  subqueries to `GET /api/listings`. Card now shows photo thumbnail with count badge.
* [x] **[UI: ListingCard — remove "View" button]** Entire card wrapped in `<Link>`.
  Edit/Inquiries/Archive use `e.stopPropagation()`.

### P4 — Card Display: title_standardized + Status Badges
* [x] **[UI: ListingCard + FeedCard — headline]** Both cards now show two-line display:
  Line 1: `address_raw`, Line 2: specs from `title_standardized` or fallback.
* [x] **[Logic: generateTitleStandardized()]** Updated in `constants.ts`. Formula:
  `<area>m² <floors>T <frontage>x<depth> <commission> <price>`. No address in title.
* [x] **[UI: StatusBadge on card thumbnails]** Badge top-left of photo, hidden for `for_sale`.

### P5 — Status Enum: Reduce to 7
* [x] **[Constants]** Removed `in_negotiations`/`pending_closing`. Final 7 values.
* [x] **[Validation]** Zod enum updated.
* [x] **[DB: migration 012]** Applied. Rows migrated, CHECK constraint updated.
* [x] **[i18n]** Dead keys removed, all 7 statuses have vi/en labels.
* [x] **[SCHEMA.md]** Updated to migration level 012.

### P6 — Feed Visibility Rules
* [x] **[API: feed query]** Added condition: `pl.status NOT IN ('sold', 'not_for_sale')
  OR EXISTS(listing_favorites WHERE agent_id = $current)`.

### P7 — Gemini API Integration
* [x] **[Config]** `GEMINI_API_KEY` already in `.env.example` and docker-compose.
* [x] **[API: `/api/ai/parse-listing`]** Rewrote with Gemini 1.5 Flash + mock fallback.
  Returns `ai_used: bool`. Installed `@google/generative-ai`.
* [ ] **[UI: parse feedback]** Confidence indicators — deferred.

### P8 — i18n: Dropdown Field Values
* [x] **[i18n]** Added `FIELD_VALUE_LABELS` map + `getFieldValueLabel()` helper.
  Covers: property_type, transaction_type, status, furnished, legal_status,
  direction, access_road, structure_type, building_type. Applied to FeedCard.

### P9 — Screenshots Folder
* [ ] **[Repo]** Create `docs/screenshots/`. Commit current-state PNGs with
  descriptive names. Claude Code reads these as visual reference for UI tasks.

---

## ⏳ Waiting On (Blocked)

* [ ] **[GEMINI_API_KEY]** Pavel to obtain and add to `.env`. Required for P7.

---

## 🧊 Backlog (Upcoming, not active this session)

* [ ] **[CRM]** Person profile: document uploads + interaction history log.
* [ ] **[CRM: Deals]** Pre-populate 2–3 seed deals for demo walkthrough.
* [ ] **[Auth]** JWT expiry + refresh tokens before public URL goes live.
* [ ] **[Agent avatars]** `avatar_url` on agents table — migration 012 (add alongside
  status constraint fix, same migration file).
* [ ] **[Photos: R2]** Cloudflare R2 for production photo storage.
* [ ] **[Deployment]** GCP VM sync after Session 15 stabilizes.

---

## 🌌 Someday / Maybe

* [ ] Re-enable Kestra + scraping pipeline post-demo.
* [ ] pgvector semantic search on listing descriptions.
* [ ] Push notifications (FCM).
* [ ] Auto-post to Zalo / TikTok / LinkedIn.
* [ ] Public listing pages (`/l/[id]?token=xxx`).
* [ ] Analytics dashboard (BigQuery post-MVP).

---

## 📋 Known Tech Debt

| Issue | Priority | Notes |
|---|---|---|
| BIGINT as string from node-postgres | High | `parseInt(row.price_vnd) \|\| null` everywhere |
| `avatar_url` missing from agents table | Medium | Add in migration 012 alongside status fix |
| Session 14 not committed or code_session logged | High | P0 of Session 15 |
| Turbopack stale 404s in dev | Low | `rm -rf web/.next` workaround |