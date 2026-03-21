# Realty Hub — Project Scope
**Sprint:** Pilot Launch (Mar 19–22, 2026)
**Target:** 10-user pilot at Nha Trang FIDT office, Mon Mar 23
**Version:** v1.0-pilot

---

## 🔴 Current Session: 23 — Pilot Branding + Data Fixes

**Branch:** `main` (direct commits)
**Linear:** REA-38, REA-35, REA-36, REA-39, REA-40
**Goal:** Final pre-pilot polish: rebrand to Realty Hub, fix stale data, preserve price precision.
**⚠️ IMPORTANT:** Do NOT deploy to VM. All work is LOCAL only. Pavel deploys manually.

### Tasks (execute top-down)

* [x] **[Rename: ProMemo → Realty Hub across entire repo — REA-38 + REA-35]**
    1. Run audit grep first to find all hits before changing anything:
       `grep -ri "promemo\|re-nhatrang-app\|re_nhatrang_app" . --include="*.ts" --include="*.tsx" --include="*.md" --include="*.sh" --include="*.yml" --include="*.json" --include="*.sql" | grep -v node_modules | grep -v .next | grep -v .git`
    2. Replace all hits: `ProMemo` → `Realty Hub` (display strings, comments, docs); `re-nhatrang-app` → `realty-hub` (container refs, script vars); stale container name `re-nhatrang-app-postgres-1` → `realty-hub-app-postgres-1`.
    3. `CLAUDE.md`: fix any remaining stale container names or app name refs (REA-35 folded in here).
    4. Browser tab: verify `web/src/app/layout.tsx` metadata has `title: "Realty Hub"`. Must say "Realty Hub" in browser tab.
    5. Login page: add FIDT logo above the login form card. Check if `/public/fidt-logo.png` exists — if not, create a placeholder SVG with FIDT text in navy `#032759`.
    6. Favicon: set FIDT logo as favicon. Add `icon` to metadata in `layout.tsx`. If no logo file exists, create a minimal SVG favicon with "F" in FIDT navy.
    7. Run audit grep again — must return zero results.

* [x] **[Seed cleanup: remove non-reference data — REA-36]**
    1. Open `src/db/seed_reference_data.sql` and remove: the `INSERT INTO agents` block for Dean, the `UPDATE raw_listings SET agent_id` block, and any other non-reference INSERTs.
    2. Seed should only contain: `nha_trang_wards`, `nha_trang_streets`, and other static lookup tables.
    3. Add pre/post data count check to `scripts/deploy-vm.sh` (update mode only): before seed, capture counts of `agents`, `parsed_listings`, `conversations`, `listing_photos`; after seed + migrations, assert each count is ≥ pre-run count; if any count dropped, print: `>>> WARNING: Row count dropped in <table>! Pre: N Post: M` (do NOT abort — just warn).

* [x] **[Fix stale title_standardized values in DB — REA-39]**
    1. Update `generateTitleStandardized()` in `web/src/lib/constants.ts`: dimension join uses `" "` not `"x"`, no `m²` suffix, no `T` suffix. Verify current code is correct.
    2. Write migration `015_fix_title_standardized.sql`. Use SQL regex to strip suffixes and fix separator in place:
       - Strip `m²` suffix: `regexp_replace(title_standardized, '(\d+(?:\.\d+)?)m²', '\1', 'g')`
       - Strip `T` suffix from floors: `regexp_replace(title_standardized, '\b(\d+)T\b', '\1', 'g')`
       - Replace `x` dimension separator with space: `regexp_replace(title_standardized, '(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)', '\1 \2', 'g')`
    3. After migration, verify: `SELECT title_standardized FROM parsed_listings WHERE title_standardized ~ '\dm²|\dT |\dx\d'` — must return zero rows.

* [x] **[Price precision: preserve agent-entered decimal places — REA-40]**
    1. Fix `formatPriceShortest()` in `web/src/lib/constants.ts`: replace `.toFixed(1)` with dynamic precision — up to 2dp, trailing zeros stripped. E.g. `parseFloat(n.toFixed(2)).toString()`.
    2. Fix `parseRawPrice()` (or equivalent): ensure full precision of input is used for VND conversion — `3.13ty` → `3130000000`, not `3100000000`.
    3. `generateTitleStandardized()`: price segment must use `price_short` (stored string) if available; fall back to `formatPriceShortest(price_vnd)` only when `price_short` is null. Add `price_short?: string | null` to the function's input type if not already present.
    4. Verify these cases work end-to-end:
       - `3.13ty` → stored `3130000000`, displayed `3.13ty`
       - `39.1ty` → stored `39100000000`, displayed `39.1ty`
       - `400.5tr` → stored `400500000`, displayed `400.5tr`
       - `20ty` → stored `20000000000`, displayed `20ty`

### End of session

* [ ] `npx tsc --noEmit` — must be clean
* [ ] Re-run audit grep from task 1 — must return zero
* [ ] Update `CLAUDE.md`: session counter → 24, last completed → "23 — 2026-03-21 — Pilot Branding + Data Fixes"
* [ ] Write `docs/code_sessions/2026-03-21-session23-pilot-branding-data-fixes.md`
* [ ] Update `docs/CHANGELOG.md`
* [ ] Commit: `git commit -m "Session 23: Pilot branding + data fixes"`
* [ ] `/export`

---

## ✅ Completed (Session 22)

* [x] Hide full-digit price — short price only — REA-34
* [x] Revive Python parser + AI layering — REA-32
* [x] Complete Nha Trang street list — REA-33
* [x] AI parse address disambiguation — REA-11
* [x] Remaining mobile polish — REA-16
* [x] Remaining i18n gaps — REA-15

## ✅ Completed (Sessions 20–21)

* [x] Docker volume pinning + migration safety — REA-25
* [x] Performance fix (prod Docker build) — REA-24
* [x] CLAUDE.md branching fix — REA-23
* [x] Multi-photo upload bug — REA-26
* [x] Bug: View Messages in Feed — REA-30
* [x] Remove AI parse followup questions — REA-28
* [x] Standardized title consistency + formula — REA-29
* [x] Zalo share text + copy button i18n — REA-31
* [x] Loading states + toasts — REA-17
* [x] OPERATIONS.md — REA-27

---

## 🧊 Backlog (post-pilot)

* [ ] Feed: full-text search polish — REA-13
* [ ] Listing export: share card image gen — REA-14
* [ ] Migrate photos to GCS — REA-18
* [x] Agent avatar upload — REA-19 (verified working, marked done)
* [ ] Notifications — REA-20
* [ ] API rate limiting — REA-21
* [ ] Gemini image/OCR parsing — REA-12
* [ ] Create 10 pilot accounts — REA-8 (blocked by user list from FIDT)
* [ ] Frontend refactoring (feature-first) — see `docs/architecture/`
* [ ] Full stack migration (Vercel + Supabase) — v2.0
* [ ] pgvector semantic search
* [ ] AI-assisted listing editing
* [ ] JWT expiry + refresh tokens
* [ ] Public listing pages
