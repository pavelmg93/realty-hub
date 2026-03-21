# Realty Hub — Project Scope
**Sprint:** Pilot Launch (Mar 19–22, 2026)
**Target:** 10-user pilot at Nha Trang FIDT office, Mon Mar 23
**Version:** v1.0-pilot

---

## 🔴 Current Session: 21 — Bug Fixes + UI Polish for Pilot

**Branch:** `main` (direct commits)
**Linear:** REA-30, REA-28, REA-29, REA-31, REA-16, REA-15, REA-11, REA-17
**Goal:** Fix bugs, clean up visual rough edges, make the app presentable for 10 real users.
**⚠️ IMPORTANT:** Do NOT deploy to VM. All work is LOCAL only. Pavel deploys manually.

### Tasks (execute top-down, bugs first)

* [ ] **[Bug: "View Messages" not clickable in Feed — REA-30]** In Feed view, the messages/inquiries button is not clickable for the listing's own agent. Works in My Listings ("Inquiries"). Investigate: routing issue, conditional rendering, or broken onClick. Fix so agent can navigate to messages from both Feed and My Listings.

* [ ] **[Remove followup questions from AI parse — REA-28]** After clicking "Parse with AI" on New Listing form, followup clarification questions appear below the parsed fields. Remove them entirely — agents find them confusing. After parse, just populate fields silently.

* [ ] **[Standardized title fixes — REA-29]**
    1. Show the same two-line standardized title (Line 1: address, Line 2: specs) at the top of the listing detail view, matching Feed and My Listings cards. Same font size across all three.
    2. Modify the specs line formula in `generateTitleStandardized()`: drop "m²" suffix after area, drop "T" suffix after floors. New format: `<area> <floors> <frontage>x<depth> <commission> <price>`
    3. Scale title text to fit inside thumbnail cards in 2-wide and 3-wide grid layouts. Use responsive font size (`text-sm` on 3-wide, `text-base` on 2-wide) or CSS `clamp()`. No text overflow/truncation — shrink to fit.

* [ ] **[Bug: Zalo share text + "Copy văn bản" — REA-31]**
    1. Fix Zalo share text format — currently broken/empty when Zalo platform is selected. Should generate shorter text than Facebook.
    2. "Copy văn bản" button label is hardcoded — move to `i18n.ts` so it respects language selector.

* [ ] **[UI: Listing detail margins — REA-16]** Listing detail page still has text going edge-to-edge. Add `px-4 sm:px-6` padding and `max-w-4xl mx-auto` container. Verify all detail page sections (header, photos, specs table, description, map) have consistent padding. Check at 375px mobile viewport.

* [ ] **[i18n: Filter field options — REA-15]** Vietnamese translations are still missing for filter dropdown option values (not just labels — the actual option text like property types, transaction types, status values, furnished options, legal status, etc.). All filter options in Feed must display in the active language. Use `getFieldValueLabel()` from `i18n.ts` — verify it covers all dropdown enums.

* [ ] **[AI: Gemini parse improvements — REA-11]**
    1. Update system prompt: explicitly request `address_raw`, `legal_status`, `access_road`, `structure_type`. These are currently missed.
    2. Price bidirectional: if Gemini returns `price_vnd`, auto-generate `price_short` (3500000000 → "3.5 tỷ"). If text has "3.5 tỷ", compute `price_vnd`.
    3. Vietnamese price utility: handle tỷ (billion), triệu (million), chấm notation.
    4. Test with 3+ real Vietnamese listing texts (hardcode test cases in the parse route or a test file).

* [ ] **[UX: Loading states + toasts — REA-17]** If not already done in Session 20:
    1. Verify `sonner` toast is installed and working.
    2. Replace any remaining `alert()` calls.
    3. Empty states with CTA for Feed, My Listings, Messages.
    4. Error states: "Something went wrong — tap to retry".

### End of session

* [ ] Create `docs/code_sessions/2026-03-21-session21-bugs-ui-polish.md`
* [ ] Update `docs/CHANGELOG.md` with Session 21 changes
* [ ] Update `CLAUDE.md` footer: session 21 / last completed 20
* [ ] `npx tsc --noEmit` clean → commit → push

---

## ✅ Completed (Session 20)

* [x] Docker volume pinning — REA-25
* [x] Performance fix (prod vs dev Docker split) — REA-24
* [x] CLAUDE.md branching fix — REA-23
* [x] Multi-photo upload bug — REA-26
* [x] create_agent.sh updated (first_name + last_name) + docs updated
* [x] schema_migrations tracking table + migrate.sh
* [x] init_db.sql made idempotent
* [x] loading.tsx skeletons added
* [x] UI margins on Feed + My Listings — REA-16 (partial — listing detail still needs work)
* [x] Vietnamese i18n partial pass — REA-15 (partial — filter options still English)
* [x] Sonner toasts installed — REA-17 (partial — verify all alert() replaced)
* [x] docs/OPERATIONS.md created — REA-27

---

## 🧊 Backlog (post-pilot)

* [ ] Feed: full-text search polish — REA-13
* [ ] Listing export: share card image gen — REA-14
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
