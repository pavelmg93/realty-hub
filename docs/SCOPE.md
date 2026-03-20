# Realty Hub — Project Scope
**Sprint:** Pilot Launch (Mar 19–22, 2026)
**Target:** 10-user pilot at Nha Trang FIDT office, Mon Mar 23
**Version:** v1.0-pilot

---

## 🔴 Current Session: 20 — Infra Hardening + Pilot Polish

**Branch:** `main` (direct commits)
**Linear:** REA-25, REA-24, REA-26, REA-23, REA-16, REA-17, REA-11, REA-15, REA-27
**Goal:** Bulletproof DB, fix performance, fix bugs, clean UI for pilot.
**⚠️ IMPORTANT:** Do NOT deploy to VM. All work is LOCAL only. Pavel deploys to VM manually.
**⚠️ SESSION LOGS:** At end of session, create `docs/code_sessions/2026-03-21-session20-infra-hardening-pilot-polish.md` using the Code Session Template in CLAUDE.md. Sessions 17–19 are missing code_session files — do NOT backfill, just start fresh from this session.

### Phase A — Infrastructure (P0, do first)

* [x] **[P0: Docker volume pinning — REA-25]**
    1. In `docker-compose.yml`, pin all volume names:
       ```yaml
       volumes:
         app-pg-data:
           name: realty-hub-pg-data
         redis-data:
           name: realty-hub-redis-data
         uploads-data:
           name: realty-hub-uploads-data
       ```
    2. Create `schema_migrations` tracking table. Migration 013:
       ```sql
       CREATE TABLE IF NOT EXISTS schema_migrations (
         version TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ DEFAULT NOW()
       );
       -- Backfill all previously applied migrations
       INSERT INTO schema_migrations (version) VALUES
         ('001_init'), ('002'), ('003'), ('004'), ('005'),
         ('006'), ('007'), ('008'), ('009'), ('010'),
         ('011'), ('012')
       ON CONFLICT DO NOTHING;
       ```
    3. Create `scripts/migrate.sh` — loops through `src/db/migrations/*.sql`, skips already-applied (checks schema_migrations), applies in order, records each.
    4. Make `init_db.sql` idempotent: all `CREATE TABLE IF NOT EXISTS`, all `CREATE INDEX IF NOT EXISTS`.
    5. Update `scripts/deploy-vm.sh` to call `scripts/migrate.sh` after container start.
    6. Test: `docker compose down && docker compose up -d` must NOT wipe data.

* [x] **[P0: Performance fix — REA-24]**
    1. Check `web/Dockerfile` — must run `npm run build` then `npm start` (NOT `npm run dev`).
    2. In `docker-compose.yml`, check web service volumes. The `./web:/app` bind mount forces dev mode. For production: remove the bind mount, let the Dockerfile's built `.next` be used. For local dev: keep it but document the tradeoff.
    3. Fix: create TWO docker-compose files:
       - `docker-compose.yml` = production (no bind mounts on web, runs built app)
       - `docker-compose.dev.yml` = local dev (bind mounts, hot reload)
       Document usage: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d` for local.
    4. Add `loading.tsx` files in `app/dashboard/`, `app/dashboard/listings/[id]/`, `app/dashboard/feed/`, `app/dashboard/messages/` — simple skeleton/spinner for instant navigation feedback.
    5. Verify on rebuild: page loads must be under 3 seconds.

* [x] **[Docs: CLAUDE.md fix — REA-23]**
    Replace the Branching Strategy section:
    ```
    ## Branching Strategy
    - **`main`** = production + daily work. Always deployable. Runs on GCP VM. Claude Code commits here.
    - **Feature branches** (`feature/<n>`) = only for risky multi-session refactors. Branch off `main`, merge back when stable.
    Daily workflow:
    1. Claude Code works on `main`
    2. After validated: deploy via `ssh VM && git pull && ./scripts/deploy-vm.sh update`
    ```
    Bump footer: `Current session number: 20` / `Last completed session: 19`
    Delete `CLAUDE-UPDATES.md` if still present.

* [x] **[Update create_agent.sh + Fresh DB seed]** After migration safety is in place:
    1. Modify `scripts/create_agent.sh` to accept: `<username> <first_name> <last_name> <password> [phone] [email]`. Update the agents INSERT to store `first_name` and `last_name` separately (add migration if agents table only has `display_name` — split to `first_name`, `last_name`, keep `display_name` as computed or for backwards compat).
    2. Update all docs referencing old script format (CLAUDE.md, RUNBOOK.md, OPERATIONS.md).
    3. Create demo accounts:
       ```bash
       scripts/create_agent.sh pavel "Pavel" "Garanin" pilot123 0868763267 pavel@fidt.vn
       scripts/create_agent.sh dean "Duy" "Pham" pilot123 0868331111 dean@fidt.vn
       ```
    4. Verify both can log in.
    5. **Do NOT deploy to VM.** Pavel will deploy manually after local testing.

---

## Phase B — Bugs + UI Polish (Pilot Trust)

**Linear:** REA-26, REA-16, REA-17, REA-11, REA-15, REA-27

* [x] **[Bug: Multi-photo upload — REA-26]** When uploading multiple photos on New Listing, only one photo is saved (overwrite loop). Fix: ensure all selected files upload and register. First photo = primary by default.

* [x] **[UI: Margins + spacing — REA-16]**
    1. Listing detail view: add `px-4 sm:px-6` padding. Max-width container with `mx-auto` on desktop.
    2. Feed page: same container treatment.
    3. My Listings page: same.
    4. All pages: ensure no text touches screen edges on 375px viewport.
    5. Touch targets: all buttons/links minimum 44px hit area.
    6. Photo grid: responsive on mobile (1 col on small, 2 col on medium).

* [x] **[UX: Loading states — REA-17]**
    1. Install `sonner` for toast notifications (lightweight, works with App Router).
    2. Replace ALL `alert()` calls with `toast.error()` or `toast.success()`.
    3. Feed: skeleton cards while loading (grey placeholder rectangles).
    4. My Listings: same skeleton pattern.
    5. Messages: skeleton for conversation list.
    6. Empty states: "No listings yet — tap + to add your first" with CTA button.
    7. Error states: "Something went wrong — tap to retry" instead of blank screen.

* [x] **[AI: Gemini parse improvements — REA-11]**
    1. Update system prompt to explicitly request these fields: `address_raw`, `legal_status`, `access_road`, `structure_type`, `property_type`, `price_vnd`, `area_m2`, `num_floors`, `num_bedrooms`, `num_bathrooms`, `frontage_m`, `depth_m`, `direction`, `furnished`.
    2. Add price bidirectional logic: if Gemini returns `price_vnd`, auto-generate `price_short` (e.g., 3500000000 → "3.5 tỷ"). If text contains "3.5 tỷ", compute `price_vnd = 3500000000`.
    3. Add Vietnamese price parsing utility: handle tỷ (billion), triệu (million), chấm notation.
    4. Test with at least 3 real Vietnamese listing texts (hardcode test cases).

* [x] **[i18n: Critical Vietnamese strings — REA-15]**
    1. Navigation sidebar: all items in Vietnamese.
    2. New Listing form: all labels + placeholders in Vietnamese.
    3. Feed filters: all filter labels in Vietnamese.
    4. Buttons: "Save", "Cancel", "Delete", "Edit", "Share", "Add Listing" — all Vietnamese.
    5. Do NOT do full exhaustive pass — just the visible, embarrassing English strings.

* [x] **[Docs: Operations cheatsheet — REA-27]** Create `docs/OPERATIONS.md` with useful Docker, DB, VM, deploy, and cleanup commands. See REA-27 on Linear for full content.

---

## ✅ Completed (Session 19)

* [x] Photo: validation + HEIC + thumbnails — REA-9
* [x] Photo: primary photo selection — REA-10
* [x] Feed: full-text search — REA-13 (done, moved to backlog for later polish)
* [x] Export: share card v1 — REA-14 (done, moved to backlog)

## ✅ Completed (Sessions 14–18)

* [x] Cloudflare HTTPS — REA-5
* [x] DB backup script — REA-6
* [x] RUNBOOK — REA-7
* [x] SESSION_LOG split — REA-22
* [x] All Session 15–18 items (see previous SCOPE)

---

## 🧊 Backlog (post-pilot)

* [ ] Feed: full-text search polish — REA-13
* [ ] Listing export: share card — REA-14
* [ ] Migrate photos to GCS — REA-18
* [ ] Agent avatar upload — REA-19
* [ ] Notifications — REA-20
* [ ] API rate limiting — REA-21
* [ ] Gemini image/OCR parsing — REA-12
* [ ] Frontend refactoring (feature-first architecture) — see `docs/architecture/`
* [ ] Full stack migration (Vercel + Supabase) — v2.0 planning
* [ ] pgvector semantic search
* [ ] AI-assisted listing editing (row prompting)
* [ ] JWT expiry + refresh tokens
* [ ] Public listing pages
