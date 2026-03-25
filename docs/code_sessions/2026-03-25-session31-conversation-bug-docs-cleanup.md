# Session: Conversation Bug Fix + Docs Cleanup
**Date:** 2026-03-25

### Summary
Fixed a P0 bug where the embedded messages section on a listing detail page showed conversations belonging to other listings. The root cause was an overly broad OR condition in the conversations API that matched any conversation with the listing owner — not just those linked to the current listing. Also cleaned up all Next.js version references across docs (15 → 16.1.6) and added a Suspense boundary rule to CLAUDE.md.

### Technical Details & Fixes
* **Features Delivered:**
  - REA-91: Embedded messages now correctly show only conversations about the current listing
  - REA-92: All live docs updated to reflect Next.js 16.1.6; CLAUDE.md Design Rules now documents the Suspense boundary requirement for `useSearchParams()`

* **Architecture/DB Changes:** None

* **Challenges Resolved:**
  - REA-91 root cause: `GET /api/conversations` with both `listing_id` and `other_agent_id` params used `c.listing_id = $X OR c.agent_1_id = $Y OR c.agent_2_id = $Y` — the agent OR matched ALL conversations with the owner across all listings. Fixed to `c.listing_id = $X OR (c.listing_id IS NULL AND (c.agent_1_id = $Y OR c.agent_2_id = $Y))` — legacy NULL-listing conversations are still surfaced, but conversations about other listings are not.

### Files Touched
- `web/src/app/api/conversations/route.ts` — fix OR-logic in WHERE clause (line 29)
- `CLAUDE.md` — Tech Stack: "Next.js 15" → "Next.js 16"; Design Rules: added Suspense boundary note
- `README.md` — "Next.js 15" → "Next.js 16.1.6"
- `docs/architecture/ARCHITECTURE.md` — removed stale duplicate "Version: Next.js 15" line
- `docs/CHANGELOG.md` — added Next.js 16.1.6 upgrade entry under Session 30b; updated ProMemo stack reference
- `docs/ROADMAP-v2.md` — "Next.js 15" → "Next.js 16"
- `docs/SCOPE.md` — marked both tasks [x]
