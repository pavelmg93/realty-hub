# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Session 30b — 2026-03-24 — REA-87 Root Cause Fix (Conversations API)

#### Fixed
- **REA-87 (P0 — 3rd attempt): Embedded messages not loading** — Identified true root cause: conversations API filtered strictly by `listing_id`, missing conversations created without `listing_id` set (e.g., started from Messages tab before listing_id tracking). Fix: added `other_agent_id` OR-logic parameter to `GET /api/conversations`; listing detail non-owner case now passes `?listing_id=X&other_agent_id=B` to surface all conversations between the two agents regardless of how listing_id was set.

---

### Session 30 — 2026-03-24 — Messages Fix + Status System + Polish

#### Fixed
- **REA-87 (P0): Embedded messages loading** — Fixed three root causes: render-time side-effect calling `fetchConversationMessages` inside JSX, fire-and-forget `await` in useEffect, and missing message fetch after new conversation creation. Existing messages now show in listing detail for both owner and non-owner views.
- **REA-90: Agent info consistency in embedded messages** — Merged conditional branches so agent info bar renders unconditionally above the message area in all states.
- **REA-89: Two-line title in message views** — Added `listing_street` to both conversation API routes and `Conversation` type. Conversation thread header and inquiries list now show `street · title_standardized`.

#### Changed
- **REA-73: Status system overhaul** — Renamed `for_sale` → `selling` across DB (migration 019), TypeScript types, i18n, constants, validation, StatusBadge, all card components. Auto-revert `just_listed` → `selling` after 7 days at read-time in 3 API routes. Feed now hides `deposit`/`sold`/`not_for_sale` unless viewer is owner or has favorited. New listings default to `just_listed`.
- **REA-88: Global cursor pointer** — Added `button, [role="button"], a { cursor: pointer; }` to globals.css.
- **REA-75: Navigation state** — Back button navigates to correct source page (`?from=` param). Scroll position saved to sessionStorage before listing detail navigation, restored on return. Grid mode persistence confirmed in place.

#### Added
- **REA-63: `scripts/sync-db.sh`** — Safe one-command PRODUCTION → LOCAL DB sync. SSH-pipes pg_dump directly to local container restore. Hardcoded target (cannot be pointed at production), container pre-check, confirmation prompt.

---

### Session 29 — 2026-03-24 — UI Polish Batch

#### Changed
- **REA-86: CLAUDE.md cleanup** — Removed duplicate "After Every Session" block, removed session number footer, fixed end-of-session flow (Claude commits locally, user pushes/deploys), clarified Deployment section.
- **REA-85: Feed header padding + FIDT logo centering** — `pt-4` now always applied to feed outer wrapper (was conditional on grid mode, causing header to sit too close to FIDT bar in map mode). TopBar left spacer changed from `w-10` to `min-w-[5rem]` to match right side and visually center the logo.
- **REA-80: Listing detail map — stacking context fix** — Map wrapper now uses `relative isolate` (CSS isolation) instead of `z-0`. Creates a new stacking context so Leaflet's internal z-indices don't bleed through the fixed FIDT header.
- **REA-83: Card/view polish (4 items)** — (1) Removed duplicate `StatusBadge` from 1-wide card info column in `ui/ListingCard.tsx`. (2) Removed `#{id}` display from all cards (`ui/ListingCard`, `listings/ListingCard`, view page, edit page title). (3) Added `StatusFlag` overlay to view page photo carousel; removed old `StatusBadge` from header. (4) `listings/ListingCard.tsx` `StatusFlag` now uses `useLanguage()`+`t()` instead of hardcoded Vietnamese labels.
- **REA-84: Message button icon-only + agent info** — All message buttons in `ui/ListingCard.tsx` and `FeedCard.tsx` are now icon-only (`MessageSquare` 14px, no text label, tooltip via `title`). Agent info bar (avatar, name, phone) added above message thread in listing detail CASE A (non-owner view).
- **REA-82: Edit page loading/error state margins** — Added `px-4 sm:px-6` to loading and error state wrappers in `edit/page.tsx`.
- **REA-71: Messages auto-expand bug** — Auto-expanding the first conversation on page load now also calls `fetchConversationMessages()` immediately, fixing the "No messages yet" shown while messages exist.
- **REA-72: Add/Edit form fixes** — (1) Section labels now i18n (commission, address). (2) STREET + WARD merged into single ADDRESS section. (3) Status field hidden from New Listing form, visible only in Edit (new `isEdit` prop on `DatabaseView`). (4) Orange `→ hh1` commission preview removed. (5) New ward dropdown added with 22 new administrative wards as options. (6) P/m² now calculated on form load for existing listings (fixed `listingToInput`). (7) DatabaseExtras dropdowns (access road, furnished, direction, structure type) now use `getFieldValueLabel()` for bilingual display. (8) AI parser `nha_rieng` → `nha_pho` in both JS regex fallback and `PYTHON_PROP_TYPE_MAP`.
- **REA-15: i18n pass** — Added keys: `commission`, `wardOld`, `wardNew`, `listingStatus`, `months`, `streetAddress`, `photoCount`. Fixed: `ConversationList` fallback `"Agent"` → `t("agent")`, `FeedFilters` removed `|| "Favorites Only"` fallback, `FeedCard` photo count now uses `t("photoCount")`.

---

### Session 28 — 2026-03-24 — Map Mode Fix (5th attempt), Detail Map, Separate View Storage

#### Changed
- **REA-79: Map mode layout fully fixed** — Outer wrapper now always `px-4 sm:px-6 max-w-3xl mx-auto` in both feed and listings (was empty string in map mode, causing full-width). Header ("Listings Feed" / "My Listings" + controls) now always visible regardless of view mode (was hidden in map mode). Toolbar: padding now comes from outer div, map mode only adds `h-12`. `MAP_HEIGHT` updated to `min(calc(100dvh - 176px), 500px)` — uses `100dvh` for mobile browser chrome, capped at 500px on desktop.
- **REA-80: Listing detail map overlap fixed** — Map wrapper div in `view/page.tsx` now has `overflow-hidden rounded-lg z-0` to prevent Leaflet controls from bleeding over the sticky FIDT header.
- **REA-81: Separate localStorage keys for feed vs listings view mode** — Feed uses `realtyhub_feed_view_mode`, Listings uses `realtyhub_listings_view_mode`. Switching view mode in one page no longer affects the other.

---

### Session 27b — 2026-03-24 — Visual Regressions, Navigation, Archive Removal

#### Changed
- **REA-74: Archive button removed from ALL UI surfaces** — removed from listing detail view action bar, cleaned up `handleArchive` from listings page and `onArchive` prop from `ListingCard`. `showArchived` filter toggle in messages is retained (it's a filter, not an action).
- **REA-78: StatusBadge removed from 1-wide card info column** — corner flag on photo is now sole status indicator. Removed `StatusBadge` import from `ListingCard`.
- **REA-78: 1-wide card font sizes increased** — title lines `text-sm` → `text-base`, metadata icons/text `text-xs` → `text-sm`.
- **REA-78: Edit page margins fixed** — `px-4 sm:px-6` added to the outer wrapper of `listings/[id]/edit/page.tsx`.
- **REA-78: Messages page property type display** — switched from `getPropertyTypeKey`+`t()` to `getFieldValueLabel("property_type", ..., lang)` so `nha_rieng`, `nha_pho`, and all types render translated labels correctly.
- **REA-77: Back button removed globally** — `ArrowLeft` removed from `TopBar`; "Back" text button removed from listing detail view. Users rely on browser navigation.
- **REA-77: View mode persisted in localStorage** — both feed and listings pages read/write `realtyhub_view_mode` (`{ viewMode, cols }`) so grid/map mode and 1/2-wide selection survive navigation.
- **REA-77: Filter button visible in map mode** — removed `viewMode !== "map"` guard on Filter button and filters panel in both feed and listings pages.

---

### Session 27 — 2026-03-24 — Layout Constants, Map Fix, Card Fixes, Auto Logging

#### Added
- **REA-68: `web/src/lib/layout-constants.ts`** — single source of truth: `TOPBAR_HEIGHT` (56), `BOTTOMNAV_HEIGHT` (64), `TOOLBAR_HEIGHT` (48), `MAP_HEIGHT` (`calc(100vh - 184px)`), `PAGE_PADDING_X`, `PAGE_MAX_WIDTH`.
- **REA-69: Status corner flag** — colored ribbon at top-left of photo in both card variants. Blue=Just Listed, Red=Price Raised/Dropped, Green=Deposit/Sold, Gray=Not For Sale. Replaces status color strip and photo overlay badge.
- **REA-69: Agent full name** — `owner_last_name` added to `Listing` type; feed API and listings API now return `a.last_name AS owner_last_name`. Both card components display `first_name + last_name`.
- **REA-76: Session logs backfilled** — S25, S25b, S26 log files created in `docs/code_sessions/`.

#### Changed
- **REA-70: Map height (4th/definitive fix)** — feed and listings pages import `LAYOUT.MAP_HEIGHT`; in map mode, header/city selector/filters/listing count are hidden, toolbar is exactly `h-12` (48px) with no extra top padding, map wrapper has `overflow-hidden`. Bottom nav height standardized to 64px (was 60px in BottomNav style).
- **REA-69: Title line 2 color** — both title lines now `text-[var(--text-primary)]` in all card variants (orange removed).
- **REA-69: Archive button removed** — `onArchive` prop and ConfirmButton for archive removed from `listings/ListingCard` (both 1-wide and 2-wide). Archived state still shows Reactivate + Delete.
- **REA-69: Title truncation** — consistent `truncate` on both title lines in all card variants.
- **REA-76: CLAUDE.md** — "After Every Session" section is now AUTOMATIC (no longer requires user to ask). Logging Workflows section updated. Session footer updated to S27.
- **AgentChip** — `last_name` added to interface; `displayName` shows full name.
- **listings API** — now JOINs agents table, returns `owner_first_name`, `owner_last_name`, `owner_phone`, `owner_username`.

---

### Session 26 — 2026-03-24 — Card Redesign, Form Overhaul, Title Fix

#### Added
- **REA-65: 1-wide horizontal card** — `ui/ListingCard` (cols===1) and `listings/ListingCard` (cols===1) now render Stitch-style horizontal card: photo w-1/3 with status color strip, right panel with StatusBadge + #id, street, title_standardized (orange), ward (MapPin), agent (User), phone (tel link), heart. `listings/page.tsx` now passes `cols` to card.
- **REA-67: Commission fields** — `generateCommissionDisplay(pct, months)` in `constants.ts`. Migration 018 adds `commission_pct NUMERIC`, `commission_months SMALLINT`, `ward_new VARCHAR(100)` to `parsed_listings`. Address consolidation: copies `address_raw` → `street` where street is empty.
- **Migration 018** — commission_pct, commission_months, ward_new columns + address consolidation backfill.

#### Changed
- **REA-66: Listing detail title fix** — Both title lines now use identical `text-2xl sm:text-3xl font-bold text-[var(--text-primary)]`. Line 1 source: `listing.street || ""` (removed `address_raw` reference). Line 2 unchanged.
- **REA-67: Form rebuild** — New field order: Description + AI Parse (top) → Property/Tx/Legal → Price/Area/P/m² (auto-calc) → Commission radio → Street → Ward/New Ward → Map → Frontage/Depth → Beds/Baths → Floors/Total Area → Photos → Docs → Extras. `address_raw` hidden from UI, `street` is the visible address field.
- **REA-67: AI parse moved into ListingForm** — Both Add and Edit pages share the same description textarea + Parse with AI button at top. `new/page.tsx` simplified.
- **ADR-005 compliance** — All `address_raw` references removed from title/line1 in all cards and feed. `listing.street || ""` is the only line-1 source everywhere.

### Session 25 — 2026-03-23 — Critical Bug Fixes + Listing Detail Cleanup

#### Added
- **REA-57: title_standardized nuclear fix** — `scripts/regenerate-titles.sh` regenerates all titles via SQL on every deploy. Called from `deploy-vm.sh update` after migrations. Formula: `<area> <floors> <frontage> <depth> <price> <commission>` — no suffixes, no ward, no address.
- **Migration 017** — Adds `city VARCHAR(100) DEFAULT 'Nha Trang'` to `parsed_listings`, backfills all rows.
- **REA-59: Feed header + city selector** — "Listings Feed" header added. City dropdown (Nha Trang/Hà Nội/TP.HCM/Đà Nẵng) filters feed via `?city=`. 2 new i18n keys: `listingsFeed`, `city`.
- **REA-62: CLAUDE.md deployment section** — Documents `deploy-vm.sh update` as single deploy command. Never run migrations manually.

#### Changed
- **REA-60: Map height** — Map height changed to `calc(100vh - 56px - 60px - 124px)` (topbar + bottomnav + page chrome) in Feed and My Listings. No more bottom nav overlap.
- **REA-61: Listing detail layout** — Removed price block (large VND + USD + m²/price). New order: title → photos → description → specs → legal → map → documents → agent → messages.
- **REA-53: Feed message routing** — All "View Messages"/"Messages" buttons in Feed (`FeedCard`, `ListingCard`) route to `/dashboard/listings/[id]/view?from=feed#messages`. Old `/dashboard/messages/[convId]` paths removed from feed.
- **REA-54: Conversation scroll** — `MessageThread` now owns its scroll container (`h-full overflow-y-auto`). Uses `scrollTop = scrollHeight` instead of `scrollIntoView` — scrolls to latest message, not property header.
- **REA-55: Conversation header redesign** — Bar 1 (Agent): avatar + name + email + phone, entire bar clickable → agent profile. Bar 2 (Property): thumb + title + specs, clickable → listing detail. Archive button removed. Conversations API returns `other_agent_id`, `listing_address_raw`, `listing_title_standardized`.
- **REA-58: Duplicate photos** — "Manage Photos" block removed from listing detail view page (view-only carousel remains). Photos management stays in edit page only.
- **REA-56: Message icon consistency** — `Eye` icon replaced with `MessageSquare` for "View Messages" button in `ListingCard`.

---

### Session 24 — 2026-03-23 — UX Polish + Messaging Redesign

#### Added
- **REA-49: Embedded messages in listing detail** — Full `#messages` section at bottom of listing detail page. Non-owners: see single thread or "start conversation" prompt that creates + populates a new conversation inline. Owners: collapsible accordion of all inquiry threads with inline reply. Feed buttons now deep-link to `#messages`.
- **REA-48: Sticky conversation headers** — Agent header and property bar in conversation thread are now `sticky top-0/top-[52px]`. Messages area is `flex-1 overflow-y-auto min-h-0`.
- **Migration 016** — `regexp_replace` SQL to fix title_standardized format: swap commission+price positions in existing rows.
- **5 new i18n keys** — `messagesAboutListing`, `noInquiriesYet`, `askAboutListing`, `typeFirstMessage`, `typeReply` (en + vi).
- **My Listings search** — Search input added to My Listings toolbar; `/api/listings` GET now supports `q` ILIKE search.

#### Changed
- **REA-41: Avatar rendering** — All conversation/listing/agents APIs now return `avatar_url`. `AgentChip` renders `<img>` with initials fallback. `ListingCard` passes `owner_avatar_url` to chip.
- **REA-42: Title format** — `generateTitleStandardized()` now puts price before commission (`100 7 10 10 20ty hh1`).
- **REA-43: Title font size** — `title_standardized` in listing detail is `text-2xl sm:text-3xl font-bold`.
- **REA-44: Listing detail linearized** — Removed tab system (Details/Photos/Documents/Map). Page is now a single scroll in correct order: title → carousel → price → specs → description → details → map → documents → agent info → messages.
- **REA-45: Map mobile** — `FeedMap` sets `touchAction: pan-y` and `scrollWheelZoom: false`. Height normalized to `calc(100vh - 200px)`.
- **REA-46: Filter chips removed** — All/Active/Under Contract/Sold/Archived tab chips removed from My Listings. Status filtering via FeedFilters panel only.
- **REA-47: Unified toolbar** — Feed and My Listings both use identical single-row toolbar: search (flex-1) + filter btn + grid toggle (grid mode only) + map toggle. 3-column grid removed.
- **REA-50: Mobile zoom disabled** — `export const viewport` with `maximumScale: 1, userScalable: false` added to `app/layout.tsx`.

---

### Session 23 — 2026-03-21 — Pilot Branding + Data Fixes

#### Added
- **REA-38+REA-35: Full rebrand ProMemo → Realty Hub** — Updated all display strings, cookie names (`realtyhub_token`), localStorage key (`realtyhub_lang`), User-Agent, docker-compose env var, docs, SQL comments, and devcontainer labels. Browser tab now shows "Realty Hub".
- **FIDT logo favicon** — Created `web/public/fidt-logo.svg` (navy #032759 with "FIDT" text). Set as favicon in `layout.tsx` metadata.
- **REA-36: Seed cleanup** — Removed `INSERT INTO agents` and `UPDATE raw_listings` blocks from `seed_reference_data.sql`. Seed is now reference-only (wards + streets).
- **Migration 015** — SQL cleanup of stale `title_standardized` values: strips `m²` area suffix, strips `T` floors suffix, replaces `x` dimension separator with space, collapses double spaces.
- **deploy-vm.sh row count assertions** — Update mode now captures pre-seed counts for agents, parsed_listings, conversations, listing_photos; prints `WARNING` if any count drops post-seed.

#### Changed
- **REA-40: Price precision** — `formatPriceShortest()` now uses up to 2dp with trailing zeros stripped (`parseFloat(n.toFixed(2)).toString()`). Fixes 3.13ty displaying as 3.1ty.
- **REA-40: AI parse price precision** — `priceVndToShort()` in AI parse route: same fix — 3130000000 → "3.13 tỷ" correctly.
- **REA-39: title_standardized formula** — `generateTitleStandardized()`: dimension separator changed from `x` to space; `price_short?: string | null` param added (uses stored short price string if available, falls back to `formatPriceShortest`).
- **REA-19: Agent avatar upload** — Verified working in pilot environment; marked done in Linear.

---

### Session 22 — 2026-03-21 — Parsing Pipeline + Price UX

#### Added
- **REA-32: Two-layer parse pipeline** — `POST /api/ai/parse-listing` now runs Python regex parser and Gemini AI in parallel. Python result takes priority for numeric fields (price, area, dimensions, access_road, legal_status, etc.); Gemini fills in address, property type, description. Python parser accessed via subprocess using `src/parsing/vietnamese_parser.py`.
- **REA-32: Docker mount** — Added `./src:/src:ro` volume to web service in `docker-compose.yml` so Python parser code is available at `/src` inside the container.
- **Migration 013** — Adds ~70 additional Nha Trang streets to `nha_trang_streets` table (central, north, south, outlying areas).

#### Changed
- **REA-34: Price UX** — Removed raw `price_vnd` number input from all listing forms (New + Edit). Only `price_raw` text field is shown (accepts formats: `6.2 tỷ`, `800tr`, `3.5 tỷ`, `800 triệu`). `price_vnd` is still stored in DB (auto-computed on blur). For existing listings, `price_raw` is pre-populated from `price_vnd` when null.
- **REA-11: Address disambiguation** — Gemini system prompt updated with explicit rule: "đường rộng" / "đường rộng X mét" = road width descriptor, NOT a street name. Mock parser updated to skip road descriptor words after "đường". Known Nha Trang street list added to system prompt for disambiguation.
- **REA-33: Street context for AI** — Full list of Nha Trang streets injected into Gemini system prompt to help distinguish street names from descriptive phrases.
- **REA-15: i18n gap fixes** — Added `parseFailed`, `requestFailed`, `uploadFailed`, `deleteFailed`, `saveFailed`, `noMessagesThread`, `noConversationsYet` keys to both `en` and `vi`. Updated MessageThread, ConversationList, PhotoUploader, DocumentManager, ListingForm, and New Listing page to use `t()` for all user-visible error/empty-state strings.
- **REA-16: Photo grid mobile** — PhotoUploader grid changed from `grid-cols-3 sm:grid-cols-4` to `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` for better mobile experience.
- New listing page AI result badge now shows `price_short` from parse response (e.g. "3.5 tỷ") instead of re-formatting `price_vnd`.
- Price placeholder updated to show multiple format examples: "6.2 tỷ, 800tr, 3.5 tỷ".

---

### Session 21 — 2026-03-21 — Bug Fixes + UI Polish for Pilot

#### Fixed
- **REA-30: "View Messages" not clickable in Feed** — `onViewMessages` in FeedPage now navigates to `/dashboard/messages` when no specific conversation ID exists (owner viewing their own listing).
- **REA-28: Remove follow-up questions from AI parse** — Removed confusing interactive question UI from the New Listing form. Parse now silently populates fields. Removed `followUpAnswers` state and `handleFollowUpAnswer` handler. Mock parser no longer returns follow-up questions.
- **REA-31: Zalo share text** — Share text now uses Vietnamese labels (`getFieldValueLabel` with `"vi"`) for property and transaction type — e.g., "Nhà phố" instead of "nha_pho". "Copy văn bản" button moved to `i18n.ts` as `copyText` key (en: "Copy text", vi: "Sao chép văn bản").
- **REA-16: Listing detail margins** — Added `px-4 sm:px-6` to the outer `max-w-4xl mx-auto` container on the listing detail view.

#### Changed
- **REA-29: Standardized title** — `generateTitleStandardized()` now omits `m²` and `T` suffixes (format: `100 7 10x10 hh1 20ty`). Listing detail view header now shows two-line standardized title (address + specs) matching Feed/My Listings cards. ListingCard font scales by grid density: `text-sm` (3-wide), `text-base` (2-wide), `text-xl` (1-wide).
- **REA-15: i18n filter options** — FeedFilters now renders all dropdown options (property type, transaction, status, legal, direction, structure, road access, furnished, building) in the active language using `FIELD_VALUE_LABELS` from `i18n.ts`. Removed English-only constants imports from FeedFilters.
- **REA-11: Gemini parse improvements** — System prompt updated with explicit rules for `address_raw`, `legal_status`, `access_road`, `structure_type` extraction including Vietnamese abbreviations. Mock parser now extracts legal status, access road, structure type, and assembles `address_raw`. `follow_up_questions` set to empty `[]`.
- **REA-17: UX verification** — Confirmed: sonner installed, no `alert()` calls, all three main pages (Feed, My Listings, Messages) have proper empty states with CTAs.

---

### Session 20 — 2026-03-21 — Infra Hardening + Pilot Polish

#### Added
- **REA-25: Docker volume pinning** — Named volumes `realty-hub-pg-data`, `realty-hub-redis-data`, `realty-hub-uploads-data`. Migration 014: `schema_migrations` tracking table + backfill of all 013 prior migrations. `scripts/migrate.sh` — idempotent migration runner that skips already-applied versions.
- **REA-24: Production Dockerfile** — Split into prod (`docker-compose.yml`) and dev (`docker-compose.dev.yml`) compose files. Dockerfile now runs `npm run build && npm start` for production. Dev compose adds bind mounts + overrides CMD to `npm run dev`.
- **REA-17: loading.tsx skeletons** — Next.js route loading files for dashboard, listing detail, feed, messages — instant spinner/skeleton on navigation.
- **REA-27: OPERATIONS.md** — New ops cheatsheet with Docker, DB, VM, deploy, cleanup commands.
- **sonner** — Toast library installed, `<Toaster />` added to root Providers (ready for future `toast.error()` / `toast.success()` usage).

#### Fixed
- **REA-26: Multi-photo upload bug** — When uploading multiple files, `onStagedPhotosChange` was called with a stale closure value causing each file to overwrite the last. Fixed by accumulating into a local array and calling once at the end.
- **REA-11: AI price parsing** — Unified price parsing via `parseVietnamesePrice()` utility in parse route. Both Gemini and mock parser now return `price_short` (e.g., `"3.5 tỷ"`) alongside `price_vnd`.

#### Changed
- **REA-23: CLAUDE.md** — Branching Strategy updated. Session counter → 20. Demo passwords updated to `pilot123`.
- **create_agent.sh** — New signature: `<username> <first_name> <last_name> <password> [phone] [email]`. Updated in CLAUDE.md, RUNBOOK.md, DEPLOYMENT.md, USAGE.md.
- **deploy-vm.sh** — Migration loop replaced by `./scripts/migrate.sh` call. Pilot account commands updated.
- **REA-16: UI margins** — Feed and My Listings pages: `px-4 sm:px-6 py-4 max-w-3xl mx-auto`. Messages page: `px-4 sm:px-6 py-4`.

---

### Session 19 — 2026-03-19 — Feature Sprint (Photos, Search, Share, UX)

#### Added
- **REA-9: Photo validation + HEIC + thumbnails** — 10MB limit, HEIC→JPEG conversion via `sharp`, 400px thumbnail generation (`thumb_<file>`). DELETE endpoint now removes files from disk. Client-side validation feedback in PhotoUploader.
- **REA-10: Primary photo selection** — Star icon in PhotoUploader to set primary. `is_primary` + `thumb_path` columns on `listing_photos` (migration 013). Feed and My Listings prefer `is_primary=TRUE` photo. First uploaded photo auto-set as primary.
- **REA-11: Gemini Vietnamese prompts** — Rewrote system prompt entirely in Vietnamese. Handles abbreviated prices, compass directions, nở hậu, multiple contacts. 30s timeout with 1 retry before regex fallback.
- **REA-13: Feed full-text search** — Migration 013: `unaccent` extension, `search_vector` tsvector + GIN index. API: `?q=<term>` prefix matching. Feed UI: search bar with 300ms debounce, result count, clear button.
- **REA-14: Share card v1** — "Create Post" generates real Vietnamese text. Zalo / Facebook format toggle. One-click copy to clipboard.
- **REA-15: i18n** — Added 10 missing keys (searchListings, shareText, setPrimary, photo errors, empty states) en+vi.
- **REA-17: Skeletons + empty states** — Skeleton loaders on Feed (4 cards), My Listings (4 cards), Messages (3 rows). Empty states with CTAs.
- **Migration 013** — `listing_photos.is_primary`, `listing_photos.thumb_path`, `parsed_listings.search_vector` (tsvector + GIN), `unaccent` extension.

#### Changed
- **Upload route** — 20MB → 10MB limit. Photos auto-converted to JPEG + thumbnail via `sharp`. HEIC/HEIF supported.
- **CLAUDE.md** — Branching updated to `main` as daily branch. Session counter → 19. CLAUDE-UPDATES.md deleted.
- **SCHEMA.md** — `listing_photos` table updated.

---

### Session 18 — 2026-03-19 — Infrastructure Hardening, Branching, RUNBOOK

#### Added
- **`develop` branch** — created and pushed to origin. All session work on `develop`.
- **`scripts/backup-db.sh`** — pg_dump to `backups/YYYY-MM-DD-HHMMSS.sql.gz`. 7-day retention, prunes older backups. `backups/` dir added with `.gitkeep`.
- **`docs/RUNBOOK.md`** — production operations: create agent accounts, backup/restore DB, restart services, view logs, apply migrations, deploy updates, health checks, common issues.
- **`DOMAIN=realtyhub.xeldon.com`** to `.env.example`.
- **Branching strategy + Development Workflow** sections added to `CLAUDE.md`.
- **Project Management / Linear** reference added to `CLAUDE.md`.
- **`backups/*.sql.gz` and `backups/cron.log`** added to `.gitignore`.
- **Session files 6–13** split from `SESSION_LOG.md` into individual `code_sessions/` files.

#### Changed
- **Project renamed** — ProMemo → Realty Hub (formerly ProMemo) in `CLAUDE.md`, `.env.example`.
- **`CLAUDE.md` session counter** bumped to 18.
- **`SESSION_LOG.md`** moved to `docs/archive/`.
- **Repo structure** map in `CLAUDE.md` updated (RUNBOOK, adrs, SESSION_LOG, archive, scripts entries).

#### Verified
- **Cloudflare HTTPS** (REA-5): No hardcoded `http://localhost` URLs in source. JWT cookie `secure: process.env.NODE_ENV === "production"` works correctly with Cloudflare Flexible SSL. `X-Forwarded-Proto` handled by Next.js automatically.
- **Gemini API key** config correct — `.env` defines `ENV_GEMINI_API_KEY`, docker-compose maps it to container `GEMINI_API_KEY`. No mismatch.

---

### Session 15 — 2026-03-16 — UI Polish, Gemini Integration, i18n Fix

#### Added
- **Gemini AI parse** — `/api/ai/parse-listing` now uses Gemini 1.5 Flash with mock regex fallback. Installed `@google/generative-ai`. Returns `ai_used: bool`.
- **i18n: FIELD_VALUE_LABELS** — bilingual (en/vi) labels for all dropdown field values (property_type, transaction_type, status, furnished, legal_status, direction, access_road, structure_type, building_type). `getFieldValueLabel()` helper function.
- **My Listings card photos** — `GET /api/listings` now returns `primary_photo` and `photo_count` subqueries. Card shows photo thumbnail with count badge.
- **Feed visibility rules** — Sold/not_for_sale listings hidden from feed unless favorited by current agent.
- **Photo upload at listing creation** — PhotoUploader staging mode: uploads to disk during form fill, registers with listing after creation. `StagedPhoto` type added.
- **Document upload at listing creation** — DocumentManager staging mode: same pattern. `StagedDocument` type added. Category picker + notes field available during creation.

#### Changed
- **Card two-line headline** — Both ListingCard (My Listings) and FeedCard (ui/ListingCard) now display: Line 1 = address_raw, Line 2 = specs (area/floors/dims/commission/price).
- **generateTitleStandardized()** — Updated formula: `<area>m² <floors>T <frontage>x<depth> <commission> <price>`. Address is no longer part of title_standardized.
- **My Listings card** — Entire card is now clickable (wrapped in `<Link>`). Removed standalone "View" button. Edit/Inquiries/Archive use stopPropagation.
- **StatusBadge** — Positioned top-left of card photo area. Hidden for `for_sale` (default status).
- **Status enum reduced to 7** — Removed `in_negotiations` and `pending_closing`. Migration 012 applied (rows migrated, CHECK constraint updated).
- **FeedCard feature tags** — Now use bilingual `getFieldValueLabel()` instead of English-only constants.
- **ListingForm** — Removed dead FreestyleEditor + "Parse Text" button (called non-existent `/api/parse`). Replaced with simple description textarea.
- **My Listings page** — Removed duplicate GridToggle and Map button from tab bar.

#### Fixed
- **Nested `<a>` hydration error** — Inner Link tags in ListingCard replaced with `<button>` + `router.push()`.
- **Messages "Loading..." hang** — Conversation [id] API queried non-existent `archived_at` and `avatar_url` columns causing 500 errors. Removed both; added error handling to fetchConversation.
- **"agent undefined" in thread header** — Race condition: component rendered before fetchConversation completed. Added loading guard.
- **Conversation list missing agent names** — Added `other_agent_first_name` and `other_agent_phone` to conversations list API.
- **PATCH handler SQL error** — Referenced non-existent `archived_by_agent_id` column; replaced with `updated_at = NOW()`.

#### Previous (Session 14)
- Fixed Add/Edit Listing ghost column errors (description_vi/description_en)
- Rebuilt Favorites API as toggle
- Migration 011: dropped old status constraint
- `scripts/deploy-vm.sh` for GCP VM deployment
- Demo accounts password reset

---

### Added
- **ProMemo web app** (Next.js 15, React 19, TypeScript, Tailwind v4) at port 8888
  - Agent login with bcrypt + JWT auth (httpOnly cookie). Account creation via admin script only.
  - Listing CRUD with freestyle text input and structured database view
  - Feed with 18 filter parameters, sorting, and pagination
  - Agent-to-agent messaging with conversation threads, 5s polling
  - Responsive mobile layout with hamburger menu
  - Auto-parse on tab switch: freestyle text auto-parsed when switching to database view
  - Reverse sync: structured fields generate human-readable text when switching to freestyle
  - Per-listing conversations: each listing gets its own message thread
  - FeedCard shows furnished, structure_type, building_type, depth, description preview
- Database migration 004: 19 feature columns, auth on agents, status/archived/agent_id on parsed_listings, conversations+messages tables
- Database migration 005: conversations per listing (listing_id column, updated unique constraint), cho_thue→ban data fix
- Parse API (`/api/parse`): calls real Python vietnamese_parser via subprocess (graceful fallback)
- 19 new parser extractors: legal_status, bathrooms, structure_type, direction, depth, corner_lot, price_per_m2, negotiable, rental_income, elevator, nearby_amenities, investment_use_case, outdoor_features, special_rooms, feng_shui, total_construction_area, land_characteristics, traffic_connectivity, building_type
- 81 new parser tests (171 total across 31 test classes)
- Docker Compose `web` service for ProMemo (port 8888)
- 11 API routes: auth (4), listings (3+archive), feed, conversations, messages, parse
- pgAdmin 4 web UI for database browsing (port 5050), auto-configured server
- `agents` table for tracking real estate agents with listing associations
- `nha_trang_wards` and `nha_trang_streets` reference tables (28 wards, 60 streets)
- Seed data script (`src/db/seed_reference_data.sql`) with Nha Trang locations
- `access_road` field: extracts road/alley access type (mat_duong, hem_oto, hem_thong, etc.)
- `furnished` field: extracts furnishing status (full, co_ban, khong)
- Smart property type classification: title-based priority, "bán đất tặng nhà" override
- Default transaction_type to "ban" when listing has property info but no explicit verb
- Comprehensive Nha Trang ward list (28 entries: 20 phường + 8 xã, pre/post-merger)
- Database migration 003 for existing databases
- 20 new tests (90 total): property type priority, default transaction, access road, furnished
- Gemini AI Copilot integration in Kestra UI (Gemini 2.5 Flash)
- Docker runner configuration for all Kestra script tasks (python:3.12-slim)
- Bidirectional flow sync script (`scripts/kestra_flow_sync.sh`)
- `demo-file-test` diagnostic flow for quick FILE upload sanity checks
- `auto_parse` toggle on `ingest-csv` flow (default: true)
- Infrastructure diagram in ARCHITECTURE.md

### Changed
- Parser: property type uses scoring + title priority instead of first-match
- Parser: transaction_type defaults to "ban" when property info present
- `docker-compose.yml` — added pgAdmin service, Kestra runs as root
- `init_db.sql` — added agents, location reference tables, access_road/furnished columns, conversations with listing_id
- `parse-listings` flow — synced inline parser with all improvements
- `parse_listings.py` — includes access_road and furnished in INSERT
- `.env.example` — added pgAdmin config variables
- `ingest-csv` flow now orchestrates both ingestion and parsing (replaces
  full-pipeline). Uses Docker runner with networkMode for DB access.
- Removed custom JSON log-writing from all flows; rely on Kestra built-in
  execution logging (Logs tab captures print() output)
- SQLAlchemy transactions use `engine.begin()` (auto-commit) in all flows
- Validation: z.preprocess coercion for BIGINT strings and empty strings (node-postgres compatibility)
- Conversations: unique constraint now includes listing_id (per-listing threads)
- Feed API: conversation lookup matches on listing_id
- SESSION_LOG.md, TESTING_LOG.md reordered to newest-first

### Fixed
- BIGINT columns (price_vnd, price_per_m2, rental_income_vnd) returned as strings by node-postgres, causing validation failures on listing edit
- Status field not accepting null/empty values on existing listings
- 5 cho_thue listings incorrectly classified (should be ban)
- "Messages" button showing on all listings after messaging one (was per-agent-pair, now per-listing)

### Removed
- `full-pipeline` flow (merged into `ingest-csv` with `auto_parse` toggle)
- Custom JSON execution log files from flows (redundant with Kestra UI)
- Public agent signup (`/api/auth/signup` still exists for script use, UI tab removed)
- Signup tab from login page (Session 8) — login-only, contact admin for account creation

## [0.1.0-dev] - 2025-02-04

### Added
- Project initialization with README.md, CLAUDE.md, CHANGELOG.md
- System architecture documentation (docs/ARCHITECTURE.md)
- Python .gitignore
