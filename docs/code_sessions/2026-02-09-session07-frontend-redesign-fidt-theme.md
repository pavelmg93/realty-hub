# Session: Front-End Redesign (FIDT Navy+Orange Theme)
**Date:** 2026-02-09

## Session 7 — 2026-02-09 — Front-End Redesign (FIDT Navy+Orange Theme)

### Summary
Complete visual redesign of ProMemo web app inspired by FIDT.vn corporate color scheme. Replaced plain black/gray UI with professional navy (#032759) + orange (#ff914d) branding. Added fixed left sidebar navigation, redesigned all cards/forms/messages, and fixed several freestyle↔database editing bugs discovered during testing.

### Changes Made

#### Theme Foundation
- **`globals.css`** — Defined FIDT theme colors as CSS custom properties via `@theme inline`: navy, navy-light, navy-dark, accent, accent-hover, slate scale
- **`constants.ts`** — Updated status badge colors: emerald (for sale), amber (negotiations), orange (pending), rose (sold), slate (not for sale)

#### Sidebar Navigation (layout.tsx)
- Replaced top navbar with fixed left sidebar (`w-60`, dark navy `#032759`)
- Inline SVG icons for Feed, My Listings, Messages nav items
- Active state: white text on navy-light bg with orange left border
- Orange "New Listing" CTA button at bottom of nav
- User avatar + logout icon at sidebar bottom
- Mobile: hamburger triggers slide-out overlay sidebar with backdrop
- Content area uses `lg:ml-60` + `pt-14 lg:pt-0` for responsive layout

#### Login Page (page.tsx)
- Split layout: navy branding section (left on desktop, top on mobile) with feature checklist
- White form card with orange accent tab underlines and submit button
- Focus rings use `focus:ring-accent/40`

#### Card Redesign (FeedCard, ListingCard)
- Larger price display in navy color (`text-xl font-bold text-navy`)
- Property type badges: navy-tinted (`bg-navy/5 text-navy`)
- Transaction badges: orange-tinted (`bg-accent/10 text-accent`)
- Feature tags: navy-tinted backgrounds (`bg-navy/5 text-navy/70`)
- Map pin SVG icon for location display
- Orange message button, navy outline edit button
- Rounded-xl cards with `border-slate-200` and `hover:shadow-md`

#### Messages Redesign
- Own messages: navy background (`bg-navy text-white`)
- Other messages: light slate (`bg-slate-100 text-slate-800`)
- Orange send button, orange unread count badges
- SVG chevron back arrow instead of `&larr;` text

#### Form Redesign (ListingForm, DatabaseView, FreestyleEditor)
- Navy mode tabs (Freestyle/Database View), orange save button
- Navy section headers in DatabaseView
- Navy "Parse Text" button in FreestyleEditor
- All inputs: `border-slate-200 rounded-lg focus:ring-accent/30 focus:border-accent`

#### Bug Fixes
- **FreestyleEditor onClick** — Changed `onClick={onParse}` to `onClick={() => onParse()}` to avoid passing MouseEvent as text arg
- **handleParse defense** — Added `typeof text === "string"` check to prevent `.trim()` on non-string
- **Feedback loop fix** — Removed `description` and `address_raw` from `formDataToText()` which caused infinite text duplication on mode switches
- **Edit mode default** — Existing listings always open in Database View (structured data = source of truth)
- **Save from DB mode** — Sets `freestyle_text = null` to prevent stale text from overwriting edits on re-edit
- **Freestyle text init** — No longer loads old `freestyle_text` from DB; starts empty for existing listings
- **Auto-parse removed** — Freestyle→Database switch no longer auto-parses; user clicks "Parse Text" explicitly
- **Edit page cache** — Added `cache: "no-store"` to prevent stale listing data
- **Price field sync** — Bidirectional sync on blur between `price_raw` and `price_vnd` using `parseRawPrice()`/`formatVndToRaw()` helpers; reads from `e.target.value` to avoid stale React closures

### Files Changed (18 files)
- `web/src/app/globals.css` — FIDT theme CSS custom properties
- `web/src/lib/constants.ts` — Status badge colors (emerald/amber/orange/rose/slate)
- `web/src/app/dashboard/layout.tsx` — Fixed left sidebar navigation
- `web/src/app/page.tsx` — Split-layout login page with navy branding
- `web/src/app/dashboard/feed/page.tsx` — Themed feed page with inline count
- `web/src/components/feed/FeedFilters.tsx` — Orange apply button, themed inputs
- `web/src/components/feed/FeedCard.tsx` — Navy/orange card redesign with icons
- `web/src/app/dashboard/listings/page.tsx` — Navy tabs, orange add button
- `web/src/components/listings/ListingCard.tsx` — Matching card design
- `web/src/components/listings/StatusBadge.tsx` — (uses updated constants)
- `web/src/app/dashboard/messages/page.tsx` — Themed heading
- `web/src/app/dashboard/messages/[conversationId]/page.tsx` — SVG back arrow, themed header
- `web/src/components/messages/ConversationList.tsx` — Navy active bg, orange unread
- `web/src/components/messages/MessageThread.tsx` — Navy own bubbles
- `web/src/components/messages/MessageInput.tsx` — Orange send button
- `web/src/app/dashboard/listings/new/page.tsx` — Themed heading
- `web/src/app/dashboard/listings/[id]/edit/page.tsx` — Themed heading, cache-busting
- `web/src/components/listings/ListingForm.tsx` — Navy tabs, orange save, editing fixes
- `web/src/components/listings/DatabaseView.tsx` — Navy sections, price sync helpers
- `web/src/components/listings/FreestyleEditor.tsx` — Navy parse button, onClick fix

### Known Issues
- Existing listings may have bloated `description` fields from pre-fix feedback loop — need manual cleanup in Database View
- Price raw↔VND sync needs further testing (user reported it not working, fix applied but not verified)
- Performance investigation still pending (dev server vs production build)

### Recommendations for Next Session
- Verify price_raw↔price_vnd bidirectional sync works after server restart
- Clean up bloated description fields on existing test listings
- Test full create→edit→re-edit cycle to confirm freestyle_text feedback loop is fully resolved
- Consider adding a "Clear Description" button or auto-detect bloated descriptions
- Phase 4 (TypeScript Parser Port) remains lower priority
