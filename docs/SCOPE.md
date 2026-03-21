# Realty Hub — Project Scope
**Sprint:** Pilot Launch (Mar 19–22, 2026)
**Target:** 10-user pilot at Nha Trang FIDT office, Mon Mar 23
**Version:** v1.0-pilot

---

## 🔴 Current Session: 22 — Parsing Pipeline + Price UX

**Branch:** `main` (direct commits)
**Linear:** REA-34, REA-32, REA-33, REA-11, REA-16, REA-15
**Goal:** Fix the parsing pipeline (Python + AI), simplify price UX, continue polish.
**⚠️ IMPORTANT:** Do NOT deploy to VM. All work is LOCAL only. Pavel deploys manually.

### Tasks (execute top-down)

* [x] **[Hide full-digit price — short price only — REA-34]**
    1. Hide `price_vnd` input from New Listing form, Edit Listing form, listing detail view, and Feed card.
    2. Show only `price_short` field for input and display. Accept formats like: `6.2ty`, `3.5 tỷ`, `800tr`, `800 triệu`.
    3. On save (backend): auto-compute `price_vnd` from `price_short`. Conversion: tỷ/ty = ×1,000,000,000; triệu/tr = ×1,000,000.
    4. Keep `price_vnd` in DB (needed for sorting/filtering) — just never show it to agents.
    5. Verify `generateTitleStandardized()` still works (already uses short price).

* [x] **[Revive Python parser + AI layering — REA-32]**
    1. Check current state of `src/parsing/` — the Vietnamese regex parser. Read its extractors, test files, and understand what fields it handles.
    2. Re-enable calling the Python parser from the parse API route. The Python parser ran via subprocess in earlier sessions — check `src/parsing/` for the entry point.
    3. Implement two-layer parse pipeline: Python parser runs first → populates fields. Gemini AI runs second → fills gaps (address, ambiguous fields). Merge: Python fields take priority unless empty.
    4. Ensure Python venv + dependencies work inside Docker (check if `src/` is mounted, Python is available in the web container or needs a sidecar).
    5. Run existing parser tests: `cd src && python -m pytest tests/ -v` (may need venv setup).

* [x] **[Complete Nha Trang street list — REA-33]**
    1. Review current `src/db/seed_reference_data.sql` — count existing streets in `nha_trang_streets`.
    2. Research and add missing Nha Trang street names. Use web search if needed. Target: all major đường and significant hẻm in all 27 phường/xã.
    3. Create migration to INSERT new streets (ON CONFLICT DO NOTHING for idempotency).
    4. Pass the street list as context to both the Gemini AI prompt and the Python parser so they can distinguish real street names from descriptive phrases like "đường rộng" (wide road).
    5. Add common abbreviations: đường→Đ., phố→P., etc.

* [x] **[AI parse: address disambiguation — REA-11 continued]**
    1. Fix "đường rộng" being parsed as a street address. Add explicit instruction to Gemini prompt: "đường rộng means 'wide road' — it is a road characteristic, NOT a street name. Only extract addresses that match known Nha Trang streets or contain a specific house number."
    2. Price bidirectional logic (if not already working from Session 21): `price_short` → `price_vnd` and vice versa.
    3. Verify parse with 3+ real Vietnamese listing texts that contain "đường rộng", "hẻm ô tô", and actual street names.

* [x] **[UI: Remaining mobile polish — REA-16]** Verify at 375px viewport:
    1. All pages have consistent padding (no edge-to-edge text anywhere).
    2. Touch targets minimum 44px on all interactive elements.
    3. Photo grid: 1 col on mobile, 2 col on tablet.
    4. New Listing form: fields don't overflow on mobile.

* [x] **[i18n: Remaining gaps — REA-15]** Quick scan for any remaining hardcoded English strings that are visible to agents. Focus on error messages, toast notifications, empty states. Do NOT do exhaustive audit — just fix what's embarrassing.

### End of session

* [ ] Create `docs/code_sessions/2026-03-21-session22-parsing-price-ux.md`
* [ ] Update `docs/CHANGELOG.md`
* [ ] Update `CLAUDE.md` footer: session 22 / last completed 21
* [ ] `npx tsc --noEmit` clean → commit → push

---

## ✅ Completed (Session 21)

* [x] Bug: "View Messages" not clickable in Feed — REA-30
* [x] Remove followup questions from AI parse — REA-28
* [x] Standardized title: consistency + formula + scaling — REA-29
* [x] Bug: Zalo share text + "Copy văn bản" i18n — REA-31
* [x] Listing detail margins — REA-16 (partial, continuing)
* [x] Filter option translations — REA-15 (partial, continuing)
* [x] Gemini parse improvements — REA-11 (partial, continuing)
* [x] Loading states + toasts — REA-17

## ✅ Completed (Session 20)

* [x] Docker volume pinning + migration safety — REA-25
* [x] Performance fix (prod Docker build) — REA-24
* [x] CLAUDE.md branching fix — REA-23
* [x] Multi-photo upload bug — REA-26
* [x] create_agent.sh (first_name + last_name)
* [x] schema_migrations + migrate.sh
* [x] OPERATIONS.md — REA-27

---

## 🧊 Backlog (post-pilot)

* [ ] Feed: full-text search polish — REA-13
* [ ] Listing export: share card image gen — REA-14
* [ ] Migrate photos to GCS — REA-18
* [ ] Agent avatar upload — REA-19
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
