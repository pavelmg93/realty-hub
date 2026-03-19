# Realty Hub — Project Scope
**Sprint:** Pilot Launch (Mar 19–22, 2026)
**Target:** 10-user pilot at Nha Trang FIDT office, Mon Mar 23

---

## 🔴 Current Session: 19 — Feature Sprint (Photos, Search, Share, UX)

**Branch:** `main` (direct commits — no develop branch)
**Linear:** REA-23, REA-9, REA-10, REA-11, REA-13, REA-14, REA-15, REA-16, REA-17

### Tasks (execute top-down)

* [x] **[Docs: CLAUDE.md branching fix — REA-23]** Branching strategy updated (main = daily work), session counter bumped to 19, CLAUDE-UPDATES.md deleted.
* [x] **[Photo: validation + HEIC + thumbnails — REA-9]** 10MB limit. HEIC→JPEG via `sharp`. 400px thumbnails (`thumb_<file>`). DELETE removes disk files. Client-side validation feedback. Migration 013.
* [x] **[Photo: primary photo selection — REA-10]** Star icon in PhotoUploader. `is_primary` + `thumb_path` columns (migration 013). PATCH endpoint. Feed + My Listings prefer is_primary photo.
* [x] **[AI: Gemini Vietnamese prompts — REA-11]** Rewrote system prompt in Vietnamese. Handles abbreviated prices (tỷ/triệu), directions (ĐN/TB etc), nở hậu, multiple contacts. 30s timeout, 1 retry, regex fallback.
* [x] **[Feed: full-text search — REA-13]** Migration 013: unaccent extension + tsvector generated column + GIN index. API: `q` param with prefix matching. UI: search bar top of Feed, 300ms debounce, result count with search term highlighted, clear button.
* [x] **[Export: share card v1 — REA-14]** "Create Post" button on listing detail. Zalo (short) / Facebook (with hashtags) format toggle. Copy to clipboard. Real Vietnamese text with address, price, specs, contact.
* [x] **[i18n: Vietnamese pass — REA-15]** Added 10 missing keys (searchListings, shareText, setPrimary, photo error messages, empty state strings) with en+vi translations. Recurring — gaps remain in form labels.
* [ ] **[Mobile: responsiveness — REA-16]** Foundation in place (TopBar+BottomNav, responsive grids). Needs browser testing at 375px to identify specific overflows. Deferred to next session.
* [x] **[UX: skeletons + empty states + toasts — REA-17]** Skeleton loaders on Feed (4 cards), My Listings (4 cards), Messages (3 rows). Empty states with CTAs: Feed (reset filters), My Listings (Add Listing button), Messages (guidance text). No alert() calls found.

---

## ✅ Completed (Session 18)

* [x] **[Git: branching]** Created `develop` branch. (Reverted — see REA-23)
* [x] **[Infra: Cloudflare HTTPS — REA-5]** Verified. No hardcoded URLs. JWT secure flag correct.
* [x] **[Infra: DB backup — REA-6]** `scripts/backup-db.sh` created. 7-day retention. Cron in RUNBOOK. ⚠️ **Not yet tested on production — Pavel to verify.**
* [x] **[Docs: RUNBOOK — REA-7]** Created `docs/RUNBOOK.md`.
* [x] **[Chore: Split SESSION_LOG — REA-22]** Sessions 6–13 split into individual files.
* [x] **[Config: .env verified]** Gemini key mapping confirmed correct.
* [x] **[Docs: CLAUDE.md update]** Renamed, restructured, bumped to session 18.

---

## ✅ Completed (Previous Sessions)

* [x] **[Gemini AI parse + mock fallback]** (Session 15)
* [x] **[i18n: FIELD_VALUE_LABELS bilingual map]** (Session 15)
* [x] **[Photo staging at listing creation]** (Session 16)
* [x] **[VM deploy + DEPLOYMENT.md]** (Session 17)
* [x] **[/export + claude-log.sh]** (Session 17)
* [x] **[Bug fixes: hydration, messages loading, agent undefined, PATCH SQL]** (Sessions 14–15)

---

## 🧊 Backlog (not this sprint)

* [ ] Migrate photos to GCS — REA-18
* [ ] Agent avatar upload — REA-19
* [ ] Notifications — REA-20
* [ ] API rate limiting — REA-21
* [ ] Gemini image/OCR parsing — REA-12
* [ ] JWT expiry + refresh tokens
* [ ] Cloud Run / Cloud SQL migration
* [ ] CRM: person profile docs + deal events
* [ ] pgvector semantic search
* [ ] Public listing pages (`/l/[id]?token=xxx`)
* [ ] Upgrade Cloudflare SSL to "Full (Strict)" with origin cert
