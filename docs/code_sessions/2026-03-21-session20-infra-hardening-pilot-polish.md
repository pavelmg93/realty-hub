# Session: Infra Hardening + Pilot Polish
**Date:** 2026-03-21

### Summary
Session 20 targeted the Pilot Launch sprint (Mar 19–22, 2026) ahead of a 10-user pilot on Mar 23. The main goals were: (1) bulletproof the database and deployment pipeline so nothing gets accidentally wiped, (2) switch Docker to a proper production build, and (3) fix a multi-photo upload bug and apply general UI/UX polish. All Phase A and Phase B tasks from SCOPE.md were completed.

### Technical Details & Fixes

* **Features Delivered:**
  - `schema_migrations` tracking table (migration 014) + `scripts/migrate.sh` — idempotent migration runner that skips already-applied versions, preventing re-run damage
  - Docker volume names pinned to `realty-hub-*` so `docker compose down` without `-v` never wipes data
  - Production Dockerfile now runs `npm run build && npm start`; dev overrides via `docker-compose.dev.yml`
  - `loading.tsx` route skeleton files for instant navigation feedback (dashboard, listing detail, feed, messages)
  - `sonner` toast library installed + `<Toaster />` in root layout
  - `docs/OPERATIONS.md` created — ops cheatsheet sourced from REA-27 on Linear
  - `price_short` computed from `price_vnd` in AI parse response (e.g., 3500000000 → "3.5 tỷ")

* **Architecture/DB Changes:**
  - Migration 014: `schema_migrations` table + backfill of versions 001–013
  - `docker-compose.yml` = production (no bind mounts on web service)
  - `docker-compose.dev.yml` = dev overrides (bind mounts + `npm run dev`)
  - `scripts/migrate.sh` replaces bare migration loop in `deploy-vm.sh`

* **Challenges Resolved:**
  - **Multi-photo upload bug (REA-26):** In `PhotoUploader.tsx`, the staging mode called `onStagedPhotosChange([...props.stagedPhotos, staged])` inside a `for` loop. Because `props.stagedPhotos` is a closure value captured at call time, each upload iteration saw the original empty array — so only the last file survived. Fixed by accumulating into a local `newStaged[]` array and calling the setter once after the loop.
  - `create_agent.sh` signature updated to accept `first_name` + `last_name` separately (API already supported this since Session 17; script was lagging). Updated in all doc references (CLAUDE.md, RUNBOOK.md, DEPLOYMENT.md, USAGE.md).

### Files Touched
- `docker-compose.yml` — volume names pinned, web bind mounts removed
- `docker-compose.dev.yml` — new file, dev overrides
- `web/Dockerfile` — production build + start
- `src/db/migrations/014_schema_migrations_tracking.sql` — new
- `scripts/migrate.sh` — new, idempotent runner
- `scripts/deploy-vm.sh` — calls migrate.sh, pilot account commands
- `scripts/create_agent.sh` — new signature with last_name
- `web/src/components/photos/PhotoUploader.tsx` — multi-upload accumulator fix
- `web/src/app/api/ai/parse-listing/route.ts` — `price_short` + `parseVietnamesePrice()` utility
- `web/src/app/providers.tsx` — `<Toaster />` added
- `web/src/app/dashboard/loading.tsx` — new
- `web/src/app/dashboard/listings/[id]/loading.tsx` — new
- `web/src/app/dashboard/feed/loading.tsx` — new
- `web/src/app/dashboard/messages/loading.tsx` — new
- `web/src/app/dashboard/feed/page.tsx` — container + margin fix
- `web/src/app/dashboard/listings/page.tsx` — container + margin fix
- `web/src/app/dashboard/messages/page.tsx` — container + margin fix
- `CLAUDE.md` — session counter, branching, pilot passwords
- `docs/SCOPE.md` — all Phase A + Phase B tasks marked [x]
- `docs/CHANGELOG.md` — Session 20 entry
- `docs/OPERATIONS.md` — new ops cheatsheet
- `docs/RUNBOOK.md`, `docs/DEPLOYMENT.md`, `docs/USAGE.md` — create_agent.sh signature updated
