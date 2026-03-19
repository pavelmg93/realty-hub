# Realty Hub — Project Scope
**Sprint:** Pilot Launch (Mar 19–22, 2026)
**Target:** 10-user pilot at Nha Trang FIDT office, Mon Mar 23

---

## 🔴 Current Session: 18 — Infrastructure Hardening

**Branch:** `main` (no develop branch yet — set up in this session)
**Linear:** REA-5, REA-6, REA-7, REA-22

### Tasks

* [ ] **[Git: branching]** Create `develop` branch off `main`. Push to origin. All session work on `develop`. Merge to `main` at end.
* [ ] **[Infra: Cloudflare HTTPS — REA-5]** Domain `realtyhub.xeldon.com` is configured via Cloudflare proxy (A record + origin rule → port 8888). See `docs/adrs/2026-03-19-ADR-003-cloudflare-https-proxy.md`. Claude Code tasks: verify app works behind proxy (check `X-Forwarded-Proto` header handling in auth/JWT), update any hardcoded `http://` or `localhost:8888` URLs, add `DOMAIN=realtyhub.xeldon.com` to `.env.example`, verify JWT `secure` cookie works with Cloudflare Flexible SSL.
* [ ] **[Infra: DB backup — REA-6]** Create `scripts/backup-db.sh` — pg_dump to `backups/YYYY-MM-DD-HHMMSS.sql.gz`. Retention: 7 daily, delete older. Add cron entry example to RUNBOOK. Test restore to temp container.
* [ ] **[Docs: RUNBOOK — REA-7]** Create `docs/RUNBOOK.md` — how to: create agent accounts, backup/restore DB, restart services, view logs, apply migrations, deploy updates.
* [ ] **[Chore: Split SESSION_LOG — REA-22]** Split `docs/code_sessions/SESSION_LOG.md` into individual session files (sessions 6–15). Match existing pattern: `YYYY-MM-DD-sessionNN-brief-topic.md`. Move SESSION_LOG.md to `docs/archive/`.
* [ ] **[Config: Verify .env]** Check that `GEMINI_API_KEY` in docker-compose.yml matches `.env` variable name. Current `.env` has `ENV_GEMINI_API_KEY` — may be a mismatch. Fix if needed.
* [ ] **[Docs: CLAUDE.md update]** Rename ProMemo → Realty Hub. Bump session counter to 18. Add branching strategy section. Add Linear reference. Update repo structure map. Apply diffs from `CLAUDE-UPDATES.md`.

---

## ⏭️ Queue (execute in order if time permits)

1. **Photo upload: validation, HEIC conversion, thumbnails — REA-9** Max file size (10MB), allowed types (jpeg/png/webp/heic). Auto-convert HEIC→JPEG via `sharp`. Generate 400px thumbnails. Verify delete cleans disk.
2. **Photo: primary photo selection — REA-10** Star icon or drag-to-first. Feed/card always shows primary.
3. **Gemini parse: improved Vietnamese prompts — REA-11** Better system prompt for tỷ/triệu, directions, nở hậu, contacts. JSON output matching schema. Timeout 30s, retry 1x, regex fallback.
4. **Feed: full-text search — REA-13** tsvector + GIN index. `unaccent` for diacritics. Search bar on Feed page, debounced 300ms.
5. **Listing export: share card v1 — REA-14** Shareable image (1080×1350) + one-click copy text. Platform templates (Zalo/Facebook).
6. **Vietnamese UI translations — REA-15** Full i18n pass: buttons, navigation, error messages, form labels, placeholders. Recurring — mark progress, don't mark done.
7. **Gemini parse: image/OCR — REA-12** Send screenshots to Gemini Vision for text extraction.
8. **Mobile responsiveness — REA-16** Critical flows on mobile viewport: Feed, Add Listing, Messages.
9. **Loading skeletons + empty states + toasts — REA-17** Replace "Loading..." and `alert()` with proper UX.
10. **Create 10 pilot accounts — REA-8** Run `scripts/create_agent.sh` with names/phones from FIDT boss. (Blocked by user list.)

---

## ✅ Done (Sessions 14–17)

* [x] **[P0: API listings POST]** Fixed Add Listing server error — ghost columns. (Session 14)
* [x] **[P0: API listings PUT]** Fixed Edit Listing server error — same. (Session 14)
* [x] **[P0: DB constraint]** Dropped stale `ck_parsed_listings_status`. Migration 011. (Session 14)
* [x] **[Favorites]** Idempotent toggle API. Heart icon. "Favorites only" filter. (Session 14)
* [x] **[Conversation header]** Agent name + initials avatar restored. (Session 15)
* [x] **[New Listing — remove Parse Text]** Dead FreestyleEditor removed. (Session 15)
* [x] **[My Listings cards]** Photo thumbnails, photo_count badge, clickable cards. (Session 15)
* [x] **[Card two-line headline]** Line 1 = address, Line 2 = specs. ADR-002. (Session 15)
* [x] **[Status enum → 7]** Removed in_negotiations, pending_closing. Migration 012. (Session 15)
* [x] **[Feed visibility]** Sold/not_for_sale hidden unless favorited. (Session 15)
* [x] **[i18n: FIELD_VALUE_LABELS]** Bilingual dropdown labels. Partial — UI chrome gaps remain (REA-15). (Session 15)
* [x] **[Gemini AI parse]** 1.5 Flash + regex fallback. (Session 15)
* [x] **[Photos: staging at creation]** Upload during form fill, register after. (Session 16)
* [x] **[Docs: staging at creation]** Same pattern for documents. (Session 16)
* [x] **[VM deploy]** promemo-demo-2 at 136.110.34.97:8888. (Session 17)
* [x] **[/export + claude-log.sh]** Chat export pipeline. (Session 17)
* [x] **[DEPLOYMENT.md]** Created. (Session 17)
* [x] **[Bug: nested <a> hydration]** Link → button + router.push(). (Session 15)
* [x] **[Bug: messages loading hang]** Removed non-existent columns from API. (Session 15)
* [x] **[Bug: agent undefined]** Loading guard for race condition. (Session 15)
* [x] **[Bug: PATCH handler SQL]** Fixed non-existent column reference. (Session 15)

---

## 🧊 Backlog (not this sprint)

* [ ] Migrate photos to GCS — REA-18
* [ ] Agent avatar upload — REA-19
* [ ] Notifications — REA-20
* [ ] API rate limiting — REA-21
* [ ] JWT expiry + refresh tokens
* [ ] Cloud Run / Cloud SQL migration
* [ ] CRM: person profile docs + deal events
* [ ] pgvector semantic search
* [ ] Public listing pages (`/l/[id]?token=xxx`)
* [ ] Upgrade Cloudflare SSL to "Full (Strict)" with origin cert
