# Session: Pilot Branding + Data Fixes
**Date:** 2026-03-21

### Summary
Final pre-pilot polish session ahead of Mon Mar 23 10-user pilot at FIDT Nha Trang. Completed four REA tickets: full ProMemo→Realty Hub rebrand across the entire repo (REA-38+REA-35), seed file cleanup to remove non-reference data rows (REA-36), price precision fix to preserve 2-decimal values like 3.13ty (REA-40), and stale title_standardized migration + code fix (REA-39). Also added FIDT logo SVG and set it as favicon, renamed auth cookie to `realtyhub_token`, and added row-count safety assertions to the deploy script.

### Technical Details & Fixes

* **Features Delivered:**
  - Browser tab now shows "Realty Hub"; FIDT navy SVG logo set as favicon
  - Login page heading updated to "Realty Hub"; profile footer updated
  - Auth cookie renamed `promemo_token` → `realtyhub_token` (users will need to re-login once)
  - Language preference key renamed `promemo_lang` → `realtyhub_lang`

* **Architecture/DB Changes:**
  - Migration 015 written: strips `m²` suffix, `T` floor suffix, replaces `x` dimension separator with space in all `title_standardized` rows; collapses double spaces
  - `generateTitleStandardized()` dim separator fixed: `join("x")` → `join(" ")`; `price_short?: string | null` param added
  - `formatPriceShortest()` precision fixed: `toFixed(1)` → `parseFloat(n.toFixed(2)).toString()` — now preserves 3.13ty, 39.1ty, 400.5tr correctly
  - `priceVndToShort()` in AI parse route: same fix applied
  - `seed_reference_data.sql`: removed `INSERT INTO agents` and `UPDATE raw_listings` blocks — seed is now reference-only
  - `scripts/deploy-vm.sh`: pre/post row count assertions added for update mode (agents, parsed_listings, conversations, listing_photos)
  - Container name updated `re-nhatrang-app-postgres-1` → `realty-hub-app-postgres-1` in scripts/backup-db.sh

* **Challenges Resolved:**
  - Audit grep needed to skip archive/, chat_exports/, code_sessions/, claude-migrate/ to avoid false positives — remaining hits in SCOPE.md task text, CHANGELOG history, and CLAUDE.md "(formerly ProMemo)" are intentional
  - Docker not running locally; migration 015 is written and will apply on next VM deploy via `./scripts/deploy-vm.sh update`
  - REA-19 (agent avatar upload) verified working by Pavel and marked done in Linear

### Files Touched
- `web/src/app/layout.tsx` — title "Realty Hub", favicon `/fidt-logo.svg`
- `web/src/app/page.tsx` — heading
- `web/src/lib/auth.ts` — cookie name
- `web/src/middleware.ts` — cookie name
- `web/src/contexts/LanguageContext.tsx` — localStorage key
- `web/src/app/api/geocode/route.ts` — User-Agent string
- `web/src/app/dashboard/profile/page.tsx` — footer text
- `web/src/lib/constants.ts` — `formatPriceShortest` precision, `generateTitleStandardized` dim separator + price_short param
- `web/src/app/api/ai/parse-listing/route.ts` — `priceVndToShort` precision
- `web/public/fidt-logo.svg` — new FIDT navy SVG logo/favicon
- `docker-compose.yml` — NEXT_PUBLIC_APP_NAME
- `scripts/deploy-vm.sh` — name + row count assertions
- `scripts/backup-db.sh` — container name
- `src/db/seed_reference_data.sql` — removed agent/raw_listings blocks
- `src/db/migrations/015_fix_title_standardized.sql` — new migration
- `README.md`, `docs/DEPLOYMENT.md`, `docs/RUNBOOK.md`, `docs/USAGE.md`, `docs/GEMINI_SETUP.md` — name refs
- `docs/SPECIFICATIONS.md`, `docs/ROADMAP-v2.md`, `docs/architecture/ARCHITECTURE.md` — name refs
- `src/db/migrations/004, 008, 009b, 010` — SQL comment container names
- `.devcontainer/devcontainer.json` — port labels
- `CLAUDE.md` — session counter → 24, migration level → 015
- `docs/SCOPE.md` — all tasks marked done
