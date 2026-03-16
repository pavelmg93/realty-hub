# Session 15: UI Polish, Gemini Integration, i18n Fix
**Date:** 2026-03-16

### Summary
Continued from Session 14 (P0 bug fixes). Executed SCOPE.md P1-P8: fixed conversation thread header regression, removed dead Parse Text button from New Listing form, added photo thumbnails and clickable cards to My Listings, implemented two-line headline display across all card components, reduced status enum from 9 to 7 values (migration 012), added feed visibility rules hiding sold/not_for_sale listings, integrated Gemini 1.5 Flash for AI listing parse with mock fallback, and added bilingual i18n labels for all dropdown field values. Fixed multiple runtime bugs: nested `<a>` tags in ListingCard, missing `archived_at` and `avatar_url` columns causing SQL errors in conversation APIs.

### Technical Details & Fixes
* **Features Delivered:**
  - Gemini 1.5 Flash AI parse with regex mock fallback (`ai_used: bool` in response)
  - Bilingual `FIELD_VALUE_LABELS` map for 8 field groups (en/vi) + `getFieldValueLabel()` helper
  - My Listings cards: photo thumbnail, photo count badge, clickable card, favorite heart
  - Two-line headline: Line 1 = address_raw, Line 2 = specs (area/floors/dims/commission/price)
  - Feed visibility: sold/not_for_sale hidden unless favorited by current agent
  - Conversation thread header shows agent name correctly (was showing "Agent" / "agent undefined")
  - Status enum reduced to 7 (removed in_negotiations, pending_closing)

* **Architecture/DB Changes:**
  - Migration 012: reduced status CHECK constraint to 7 values, migrated existing rows
  - `generateTitleStandardized()` updated: address removed from title, now specs-only
  - `@google/generative-ai` npm package added
  - Conversations list API now returns `other_agent_first_name` and `other_agent_phone`
  - Removed `avatar_url` reference from conversation [id] API (column not in DB)
  - Removed `archived_at` reference from conversation [id] API (column not in DB)

* **Bugs Fixed:**
  - Nested `<a>` hydration error: inner Link tags inside card Link replaced with button + router.push()
  - Messages page "Loading..." hang: conversation [id] API queried non-existent `archived_at` and `avatar_url` columns causing 500 errors; fetchConversation had no error handling
  - Conversation PATCH handler referenced non-existent `archived_by_agent_id` column
  - "agent undefined" in thread header: component rendered before fetchConversation completed (race condition)
  - Dead FreestyleEditor + handleParse calling non-existent `/api/parse` endpoint removed
  - Duplicate GridToggle + Map button in My Listings tab bar removed

### Files Touched
- `web/src/app/api/listings/route.ts` — added primary_photo + photo_count subqueries
- `web/src/app/api/feed/route.ts` — P6 feed visibility rule (hide sold/not_for_sale unless favorited)
- `web/src/app/api/ai/parse-listing/route.ts` — rewritten with Gemini + mock fallback
- `web/src/app/api/conversations/route.ts` — added other_agent_first_name, other_agent_phone
- `web/src/app/api/conversations/[id]/route.ts` — removed archived_at, avatar_url, fixed PATCH
- `web/src/app/dashboard/messages/[conversationId]/page.tsx` — loading guard, error handling, name fallback
- `web/src/app/dashboard/listings/page.tsx` — removed duplicate controls
- `web/src/components/listings/ListingCard.tsx` — rewritten: photo, clickable Link, two-line headline
- `web/src/components/listings/ListingForm.tsx` — removed FreestyleEditor, dead handleParse
- `web/src/components/ui/ListingCard.tsx` — two-line headline, removed PriceDisplay
- `web/src/components/feed/FeedCard.tsx` — two-line headline, bilingual field labels
- `web/src/components/messages/ConversationList.tsx` — use other_agent_first_name
- `web/src/lib/constants.ts` — updated generateTitleStandardized (specs-only, no address)
- `web/src/lib/i18n.ts` — FIELD_VALUE_LABELS map, getFieldValueLabel(), removed dead status keys
- `web/src/lib/types.ts` — ListingStatus reduced to 7
- `web/src/lib/validation.ts` — status enum reduced to 7
- `src/db/migrations/012_reduce_status_enum.sql` — new migration
- `docs/SCHEMA.md` — updated migration level, avatar_url note
- `docs/SCOPE.md` — P1-P8 checked off
- `docs/CHANGELOG.md` — Session 15 entry
- `CLAUDE.md` — updated session number, migration level
