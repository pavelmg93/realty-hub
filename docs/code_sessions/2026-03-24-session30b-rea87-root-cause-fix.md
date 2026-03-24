# Session: REA-87 Root Cause Fix — Conversations API OR-Logic
**Date:** 2026-03-24

### Summary
Session 30b was a sequential do-over of Session 30 (which used subagents). On inspection, S30's code was already committed and all issues except REA-87 were correctly implemented. REA-87 had been attempted twice before (S29, S30) and was still broken. This session did a thorough code trace following the issue's escalation protocol, identified the true root cause, posted findings as a comment on the Linear issue, then implemented a targeted 3-line fix.

### Technical Details & Fixes

* **Features Delivered:**
  - REA-87 (P0): Embedded messages now surface existing conversations in listing detail — for both owner and non-owner views
  - REA-90, REA-89, REA-73, REA-88, REA-75: Verified correct from S30, no additional changes needed

* **Root Cause (REA-87):**
  The conversations API `GET /api/conversations?listing_id=X` used strict equality: `AND c.listing_id = $2`. Conversations created from the standalone Messages tab (or predating listing_id tracking) have `listing_id = NULL` and were never matched. The component logic was correct all along — it just never received any rows.

* **Fix:**
  1. `GET /api/conversations` now accepts optional `other_agent_id` param. When both `listing_id` and `other_agent_id` are provided, the WHERE clause uses OR logic: `AND (c.listing_id = $N OR c.agent_1_id = $M OR c.agent_2_id = $M)` — returning conversations matching either the listing OR involving the specified agent.
  2. Listing detail non-owner fetch changed to `?listing_id=X&other_agent_id=${listing.agent_id}`.
  3. Post-create-conversation reload uses the same extended query.

* **Architecture/DB Changes:** No schema changes. API-level only.

* **Challenges Resolved:**
  Previous two attempts kept reimplementing the message render/fetch flow (which was actually correct). The real issue was always upstream at the data retrieval layer — the API returned 0 rows because existing conversations lacked `listing_id`.

### Files Touched
- `web/src/app/api/conversations/route.ts` — added `other_agent_id` OR-logic
- `web/src/app/dashboard/listings/[id]/view/page.tsx` — non-owner fetch + post-create reload use extended query
- `docs/SCOPE.md` — all 6 tasks marked [x]
- `docs/CHANGELOG.md` — Session 30b entry added
