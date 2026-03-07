# Session Log

Detailed record of each coding session. Updated after every completed
successful session. **Newest sessions first.**

---

## Session 10 — 2026-03-07 — Demo Roadmap, GCP Strategy, CURSOR.md

### Summary

Planning session via Claude.ai (web). Defined the Demo build target, resolved infra 
choices, added EN/VN language switching, and generated CURSOR.md for Cursor IDE.

### Key Decisions Made

- **Platform rename**: "RE Nha Trang" → "ProMemo" (internal only, fidt.vn / Wealth Realty)
- **Demo scope**: UI polish + full CRM (persons, deals kanban). AI features scaffolded only.
- **Kestra**: Commented out in docker-compose for Demo. Re-enable for MVP.
- **Infra**: GCP (Cloud Run + Cloud SQL + GCS) instead of Railway. GCP credits available.
- **BigQuery**: Post-MVP analytics layer only. Not for live app (use Cloud SQL for OLTP).
- **DuckDB**: Local analytics tool only. Not relevant to web app.
- **Language switcher**: EN ↔ VN toggle (LanguageContext + flat i18n.ts). 
  Per-listing translate button calls Google Cloud Translation API (scaffolded).
- **Auth**: Confirmed login-only. No public signup. create_agent.sh is the only path.
- **Port clarification**: Web runs on 3000 internally, mapped to 8888 in Docker Compose.

### Files Created

- `CURSOR.md` — Cursor IDE instructions for Demo build
- `src/db/migrations/008_crm_schema.sql` — persons, deals, deal_events tables (planned)
- Updated `scripts/seed_demo_users.sh` — creates dean, sarah, minh

### Recommendations for Next Session

- Open repo in Cursor, run Section 2.1 (comment out Kestra) first
- Run migration 008 before building CRM screens
- create_agent.sh port may need updating (see DOC_FIXES.md)
- Port for `npm run dev` is 3000 (not 8888 — that's Docker only)

---

## Session 9 — 2026-02-13 — Web Scraping Pipeline (batdongsannhatrang.org)

### Summary
Built a Playwright-based web scraping pipeline for ingesting Vietnamese real estate listings from batdongsannhatrang.org. Added 3 new parser extractors (road width, frontage count, beach distance), created a reusable scraper framework with base class + site-specific implementation, and CLI entry point.

### Changes Made

#### Database Migration 007
- `raw_listings`: Added `source_url VARCHAR(500)` with unique index, `source_listing_id VARCHAR(100)` for provenance tracking
- `parsed_listings`: Added `road_width_m DOUBLE PRECISION`, `num_frontages SMALLINT`, `distance_to_beach_m DOUBLE PRECISION`

#### Vietnamese Parser Enhancements
- `extract_road_width(text)`: Parses "duong rong 20m", "lo 12m" -> float
- `extract_num_frontages(text)`: Parses "2 mat tien", "hai mat tien" -> int
- `extract_distance_to_beach(text)`: Parses "cach bien 300m" -> float
- Added 3 fields to `ParsedListing` dataclass + wired into `parse_listing()`

#### Scraping Module (`src/scraping/`)
- `base_scraper.py`: Abstract `BaseScraper` with `ScrapedListing` dataclass. Handles DB insertion (raw + parsed), photo downloading, dedup by source_url, Playwright lifecycle.
- `batdongsannhatrang.py`: Site-specific scraper. Discovers listings from category pages + pagination. Extracts embedded `languageText.jsonProductIndex` JSON for structured data, description text, and photos.
- `photo_downloader.py`: Async httpx photo downloader with content-hashed filenames for dedup.
- `cli.py`: Click CLI entry point: `python -m src.scraping.cli --site batdongsannhatrang --agent-phone 0901953889`
- `__main__.py`: Module runner support.

#### Dependencies
- Added `[project.optional-dependencies] scraping` with `playwright>=1.40`, `httpx>=0.27`
- Installed Chromium headless shell via `playwright install chromium`

#### Web App Updates
- Validation schema: Added `road_width_m`, `num_frontages`, `distance_to_beach_m` to Zod listingSchema
- POST/PUT API routes: Added 3 new columns to INSERT/UPDATE statements
- Feed API: Added `num_frontages_min` and `distance_to_beach_max` filter params

#### Documentation
- `SPECIFICATIONS.md`: Added "Data Acquisition" section with architecture diagram, scraper how-to, dedup strategy
- Updated `CLAUDE.md` and `SESSION_LOG.md`

#### Bug Fixes (Session 9b — 2026-02-14)
- Photo extraction: Fixed `[data-img]` selector grabbing ALL images on page (40-60 per listing), now filters by `product/{listing_id}_` URL pattern — yields 1-2 photos per listing (correct)
- Photo dedup: Fixed duplicate registration when same photo URL appears in both `data-img` and `src` attributes (post-JS lazy load)
- Photo URL encoding: Added `urllib.parse.quote()` for filenames with spaces (e.g., `chauloan88 (0).png`)
- Street extraction: Rejected false-positive matches where "duong rong 20m" (road width) was captured as street name
- CLI DB URL: Fixed default credentials to match Docker Compose config

### Key Recommendations
- **Migration 007** must be run before scraper: `docker exec -i re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang < src/db/migrations/007_scraping_fields.sql`
- Create agent Chau Loan before scraping: `./scripts/create_agent.sh chauloan "Chau Loan" bdsntorg 0901953889`
- Run scraper: `python -m src.scraping.cli --site batdongsannhatrang --agent-phone 0901953889 --max-listings 5`
- Use `--no-headless` flag for debugging to see the browser
- Photos are stored in `./uploads/listings/<parsed_id>/` with content-hashed filenames
- The scraper overlays structured JSON data from the site on top of parser results (site data wins for price, area, direction)
- Re-running the scraper safely skips already-imported URLs (unique index on source_url)
- Docker container name: `re-nhatrang-app-postgres-1` (not `renhatrang-postgres`)
- DB credentials: user=re_nhatrang, password=change_me_in_production, db=re_nhatrang

---

## Session 8 — 2026-02-12 — Maps, Photos, Documents, Auth Cleanup

### Summary
Major feature session: OpenStreetMap integration (per-listing map + feed map view), photo uploads, document management per listing, auth simplification (login-only, no public signup), listing detail page, and 14 sample listings with real Nha Trang addresses and GPS coordinates.

### Changes Made

#### Database Migration 006
- `parsed_listings`: Added `latitude DOUBLE PRECISION`, `longitude DOUBLE PRECISION` columns
- Created `listing_photos` table (id, listing_id FK, file_path, original_name, file_size, display_order, created_at) with CASCADE delete
- Created `listing_documents` table (id, listing_id FK, file_path, file_name, original_name, file_size, mime_type, category CHECK, notes, created_at)
- Document categories: ownership_cert, floorplan, property_sketch, use_permit, construction_permit, proposal, other
- Indexes on listing_id, (listing_id, category), and partial coordinate index

#### File Upload Infrastructure
- `docker-compose.yml`: Added `uploads-data` named volume mounted at `/app/uploads`, `UPLOAD_DIR` env var
- `POST /api/upload`: Multipart form data handler, generates unique filenames, validates file types (images for photos, images+PDF for documents), 20MB limit
- `GET /api/files/[...path]`: Serves uploaded files with proper MIME types, directory traversal prevention, immutable cache headers
- `next.config.ts`: Set `serverActions.bodySizeLimit` to 20MB

#### Photo Feature
- `POST/GET/DELETE /api/listings/[id]/photos`: CRUD with ownership verification, auto display_order
- `PhotoUploader` component: Drag-and-drop upload, photo grid with primary badge, delete on hover, responsive 2/3/4 column grid
- Feed API: Added subquery for `photo_count` and `primary_photo` per listing
- `FeedCard`: Shows photo thumbnail with photo count badge at top of card
- Edit page: Tabbed interface (Listing Data | Photos | Documents)

#### Document Feature
- `POST/GET/DELETE /api/listings/[id]/documents`: CRUD with category validation and ownership checks
- `DocumentManager` component: Category-grouped display, PDF/image icons, upload form with category selector and notes, view/delete actions
- `DOCUMENT_CATEGORIES` constant added to `constants.ts`

#### OpenStreetMap Integration
- Installed `react-leaflet`, `leaflet`, `@types/leaflet`
- `ListingMap` component: Single marker map with click-to-place, Nha Trang center default (12.2388, 109.1967)
- `FeedMap` component: Multi-marker map with popups showing listing info + photo, auto-bounds to fit markers
- `DynamicListingMap` / `DynamicFeedMap`: SSR-safe dynamic imports with loading states
- `DatabaseView`: Added lat/lng number fields + `LocationPicker` with Nominatim geocoding and interactive map
- `GET /api/geocode`: Nominatim proxy with "Nha Trang, Khanh Hoa, Vietnam" suffix
- Feed page: Grid/Map toggle with SVG icons; map mode fetches up to 200 listings

#### Listing Detail Page
- `GET /dashboard/listings/[id]/view`: Read-only detail page with tabbed interface (Details | Photos | Documents | Map)
- Hero photo gallery (primary + grid), price banner, two-column property/details specs, description, agent contact
- Photos tab reuses PhotoUploader in readOnly mode
- Documents tab reuses DocumentManager in readOnly mode
- Map tab shows ListingMap with popup
- `ListingCard`: Added "View" link alongside "Edit"
- `FeedCard`: Entire card is clickable, navigates to detail page; message buttons use stopPropagation

#### Auth Simplification
- Removed signup tab from login page — login only with "Contact your admin" note
- Login now redirects to `/dashboard/feed` instead of `/dashboard/listings`
- Signup API route kept (used by admin script)
- `scripts/create_agent.sh`: CLI script for manual account creation via signup API

#### Sample Data
- `scripts/seed_sample_listings.sql`: 14 listings with real Nha Trang addresses
- Covers: beachfront villas (Tran Phu), houses (Nguyen Thien Thuat, Hung Vuong, Pasteur, Thai Nguyen), apartments (Gold Coast, Muong Thanh, VCN), land plots (Le Hong Phong, 2 Thang 4, Phuoc Dong), commercial (Yersin)
- All with GPS coordinates, diverse wards, realistic prices (850M to 25B VND)

### New Files (15)
- `src/db/migrations/006_photos_documents_coordinates.sql`
- `web/src/app/api/upload/route.ts`
- `web/src/app/api/files/[...path]/route.ts`
- `web/src/app/api/geocode/route.ts`
- `web/src/app/api/listings/[id]/photos/route.ts`
- `web/src/app/api/listings/[id]/documents/route.ts`
- `web/src/components/photos/PhotoUploader.tsx`
- `web/src/components/documents/DocumentManager.tsx`
- `web/src/components/map/ListingMap.tsx`
- `web/src/components/map/FeedMap.tsx`
- `web/src/components/map/DynamicListingMap.tsx`
- `web/src/components/map/DynamicFeedMap.tsx`
- `web/src/app/dashboard/listings/[id]/view/page.tsx`
- `scripts/create_agent.sh`
- `scripts/seed_sample_listings.sql`

### Modified Files (15)
- `docker-compose.yml` — uploads volume
- `web/package.json` — leaflet, react-leaflet deps
- `web/next.config.ts` — body size limit
- `web/src/lib/types.ts` — lat/lng, ListingPhoto, ListingDocument types
- `web/src/lib/validation.ts` — lat/lng fields
- `web/src/lib/constants.ts` — DOCUMENT_CATEGORIES
- `web/src/app/api/listings/route.ts` — lat/lng in INSERT
- `web/src/app/api/listings/[id]/route.ts` — lat/lng in UPDATE
- `web/src/app/api/feed/route.ts` — photo_count, primary_photo subqueries
- `web/src/app/page.tsx` — login-only, no signup tab
- `web/src/app/dashboard/feed/page.tsx` — grid/map toggle
- `web/src/app/dashboard/listings/[id]/edit/page.tsx` — tabbed with photos/docs
- `web/src/components/feed/FeedCard.tsx` — photo thumbnail, clickable, stopPropagation
- `web/src/components/listings/ListingCard.tsx` — View link
- `web/src/components/listings/ListingForm.tsx` — lat/lng mapping
- `web/src/components/listings/DatabaseView.tsx` — lat/lng fields, LocationPicker

### Setup After Fresh DB
```bash
# After docker compose down -v && up -d:
docker exec -i <container> psql -U re_nhatrang -d re_nhatrang < src/db/seed_reference_data.sql
docker exec -i <container> psql -U re_nhatrang -d re_nhatrang < src/db/migrations/002_add_listing_hash_and_message_date.sql
docker exec -i <container> psql -U re_nhatrang -d re_nhatrang < src/db/migrations/003_add_agents_access_road_furnished_locations.sql
docker exec -i <container> psql -U re_nhatrang -d re_nhatrang < src/db/migrations/004_promemo_schema.sql
docker exec -i <container> psql -U re_nhatrang -d re_nhatrang < src/db/migrations/005_conversations_per_listing.sql
docker exec -i <container> psql -U re_nhatrang -d re_nhatrang < src/db/migrations/006_photos_documents_coordinates.sql
# Create agent account:
./scripts/create_agent.sh dean Dean password123 0868331111
# Seed sample listings:
docker exec -i <container> psql -U re_nhatrang -d re_nhatrang < scripts/seed_sample_listings.sql
```

### Bug Fixes (late session)
- **GET /api/listings/[id]**: Was blocking non-owners with 403, causing all detail views to fallback and display the same listing. Fixed: any authenticated user can now view any listing (ownership check only on PUT/DELETE).
- **FeedMap marker click**: Marker `eventHandlers.click` was navigating immediately instead of opening the popup. Fixed: removed eventHandlers, navigation now only via "View Details" button inside popup.
- **Listing detail fallback**: Removed broken fallback to `/api/feed?listing_id=${id}` (feed API doesn't support `listing_id` param). No longer needed since GET endpoint works for all auth users.
- **Docker build**: Created `web/.dockerignore` (excludes `node_modules`, `.next`) to fix build failures from `.next` cache files.
- **Note**: Web container must be restarted (`docker compose restart web`) to pick up these fixes.

### Recommendations for Next Session
- **First thing**: restart web container to apply the 3 bug fixes above
- Leaflet default marker icons loaded from unpkg CDN — consider bundling locally for offline/production
- Nominatim geocoding is rate-limited (1 req/sec) — add client-side debounce if needed
- Photo reordering (drag-to-sort) not implemented yet — currently ordered by upload time
- Document preview (inline PDF viewer) not implemented — currently opens in new tab
- Consider adding image compression/thumbnails for performance
- Test with Docker Desktop running: full upload→serve→display cycle
- Public hosting setup: need to configure CORS, HTTPS, and domain

---

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

---

## Session 6 — 2026-02-08 — ProMemo Bug Fixes, Auto-Parse, Conversations Per Listing

### Summary
User-driven testing session. Fixed 9 reported issues from manual testing of ProMemo web app. Major changes: conversations are now per-listing (not per-agent-pair), Vietnamese parser connected to web API, auto-parse on tab switch implemented.

### Changes Made

#### Bug Fixes
- **Fixed 5 cho_thue listings** → changed to "ban" (migration 005)
- **Fixed validation error** when editing listings with blank transaction_type. Root cause: BIGINT columns (price_vnd, price_per_m2, rental_income_vnd) returned as strings by node-postgres, rejected by z.number(). Fix: z.preprocess coercion helpers (coerceNum, coerceInt, optStr) in validation.ts
- **Fixed status field** not accepting null — added nullable handling with fallback to "for_sale"
- **Improved error display** — validation errors now show which field failed
- **Fixed turbopack cache** causing stale routes (conversations/[id]/messages returning 404)

#### Conversations Per Listing (Migration 005)
- Added `listing_id INTEGER NOT NULL` to conversations table
- Changed unique constraint from `(agent_1_id, agent_2_id)` to `(agent_1_id, agent_2_id, listing_id)`
- Updated conversations API: POST requires listing_id, GET returns listing context (property_type, ward, price, area)
- Updated feed API: LEFT JOIN matches on listing_id (per-listing conversation lookup)
- Updated feed page: passes listing_id when creating conversation
- ConversationList: shows listing context (property type, ward, price, area)
- Conversation header: shows listing context
- Each listing now gets its own "Message"/"Messages" button independently

#### Auto-Parse on Tab Switch
- **Parse API** (`/api/parse`): No longer a stub. Calls real Python vietnamese_parser via subprocess with stdin piping. Falls back gracefully if Python unavailable.
- **Freestyle → Database View**: Auto-triggers parser when text changed since last parse. Shows "Parsing..." state.
- **Database View → Freestyle**: Generates human-readable text summary from structured fields (formDataToText function).
- Tracks lastParsedText ref to avoid re-parsing unchanged text.
- Tab switches and Save disabled during parsing.

#### FeedCard Improvements
- Added: furnished, structure_type, building_type, depth_m tags
- Added: description preview (2-line clamp)

#### Log Reordering
- SESSION_LOG.md and TESTING_LOG.md both reordered to newest-first convention

### Files Changed
- `web/src/lib/validation.ts` — z.preprocess coercion for BIGINT/empty strings
- `web/src/app/api/parse/route.ts` — Python parser subprocess integration
- `web/src/components/listings/ListingForm.tsx` — auto-parse, formDataToText, switchMode
- `web/src/components/listings/FreestyleEditor.tsx` — async onParse prop
- `web/src/app/api/conversations/route.ts` — listing_id support
- `web/src/app/api/feed/route.ts` — per-listing conversation JOIN
- `web/src/app/dashboard/feed/page.tsx` — pass listing_id on message
- `web/src/components/feed/FeedCard.tsx` — more feature tags, description preview
- `web/src/components/messages/ConversationList.tsx` — listing context display
- `web/src/app/dashboard/messages/[conversationId]/page.tsx` — listing context header
- `web/src/lib/types.ts` — Conversation.listing_id + listing context fields
- `src/db/init_db.sql` — conversations table with listing_id
- `src/db/migrations/005_conversations_per_listing.sql` — migration
- `docs/SESSION_LOG.md`, `docs/TESTING_LOG.md` — newest-first reorder

### Recommendations for Next Session
- Clear `.next` cache (`rm -rf web/.next`) when routes return unexpected 404s — turbopack caches aggressively
- Parse API calls Python subprocess — requires python3 and src/parsing available from web/ parent dir
- Test validation by editing Dean's listings (BIGINT price_vnd values)
- Phase 4 (TypeScript Parser Port) is now less urgent since Python parser works via API
- Performance investigation still pending (dev server vs production build)
- After `docker compose down -v && up -d`, run migrations 002-005 and seed_reference_data.sql

---

## Session 5 — 2026-02-07 — ProMemo Web App: Full Frontend Implementation

### Summary

Built the complete ProMemo frontend: all page components for listings management,
feed browsing, and agent messaging. Added Docker Compose integration and updated
all documentation. The web app is now fully functional with signup/login, listing
CRUD (freestyle + database view), feed with 18 filters, and real-time messaging.

### Features Delivered

- **My Listings page** (`/dashboard/listings`): Active/archived tabs, sorting,
  grid layout with ListingCard components
- **Listing editor**: Dual-mode form (Freestyle Message + Database View tabs)
  - FreestyleEditor: textarea for Vietnamese text, "Parse Text" button
  - DatabaseView: structured form with all fields grouped by category
    (Classification, Price & Area, Location, Dimensions, Structure & Features,
    Extra Details, Description)
- **Create/Edit pages**: `/dashboard/listings/new` and `[id]/edit`
- **Feed page** (`/dashboard/feed`): All active listings from all agents
  - FeedFilters: 18 filter parameters (10 exact match, 5 range, 3 boolean)
  - FeedCard: owner info, Message/Messages buttons, feature badges
  - Pagination with page count
- **Messages page** (`/dashboard/messages`): Conversation list with unread counts
- **Conversation page** (`/dashboard/messages/[id]`): Message thread with
  auto-scroll, 5-second polling, chat bubble layout (own=right, other=left)
- **Docker Compose**: `web` service with volume mounts for hot reload
- Updated ARCHITECTURE.md, USAGE.md, CHANGELOG.md

### Architecture Decisions

- **No TypeScript parser yet**: Parse route remains a stub. The freestyle editor
  sends text to `/api/parse` which returns description only. Full TS parser port
  deferred to Phase 4 (separate session). Agents can still manually fill in all
  fields via Database View tab.
- **Polling for messages**: 5-second interval polling via setInterval. Acceptable
  for V1 with few users. WebSocket upgrade planned for V2 if needed.
- **Feed filters apply on button click**: Filters are collected in state, then
  applied when user clicks "Apply". Sort changes also trigger re-fetch. This
  avoids excessive API calls while filter params are being adjusted.
- **Conversation get-or-create**: "Message" button on feed cards POST to
  `/api/conversations` which uses INSERT ON CONFLICT DO NOTHING for idempotent
  creation. Always returns the existing or new conversation.

### Challenges

- **White text on white background**: First manual test revealed the app was
  nearly invisible. Root cause: Next.js default `globals.css` includes
  `@media (prefers-color-scheme: dark)` which changes body text to light color
  when OS uses dark mode, but all component backgrounds are hardcoded white.
  Fix: removed dark mode media query, forced `color-scheme: light`, added
  explicit dark text color on form elements.

### Recommendations

- Run `cd web && npm run dev` for local development (hot reload, port 8888).
- Use `docker compose up -d` to run ProMemo inside Docker alongside other services.
- The parse route is a stub — agents must use Database View for structured data
  until the TS parser port is complete.
- Seed reference data after fresh DB: `docker exec ... psql -f seed_reference_data.sql`

### Test Results

- Next.js build: 0 errors, all 17 routes compiled successfully
- Python tests: 171 passed (unchanged, no new Python code)

### Files Created

New frontend files:
- `web/src/app/dashboard/listings/page.tsx` — My Listings page
- `web/src/app/dashboard/listings/new/page.tsx` — Create listing
- `web/src/app/dashboard/listings/[id]/edit/page.tsx` — Edit listing
- `web/src/app/dashboard/feed/page.tsx` — Feed page
- `web/src/app/dashboard/messages/page.tsx` — Messages page
- `web/src/app/dashboard/messages/[conversationId]/page.tsx` — Conversation
- `web/src/components/listings/ListingForm.tsx` — Dual-mode form
- `web/src/components/listings/FreestyleEditor.tsx` — Freestyle textarea
- `web/src/components/listings/DatabaseView.tsx` — Structured form fields
- `web/src/components/feed/FeedCard.tsx` — Feed listing card
- `web/src/components/feed/FeedFilters.tsx` — Filter panel
- `web/src/components/messages/ConversationList.tsx` — Conversation list
- `web/src/components/messages/MessageThread.tsx` — Message bubbles
- `web/src/components/messages/MessageInput.tsx` — Message input
- `web/Dockerfile` — Dev container for Docker Compose

Modified:
- `docker-compose.yml` — added `web` service
- `.env.example` — added WEB_PORT, JWT_SECRET
- `docs/ARCHITECTURE.md` — ProMemo section, data model, Docker diagram
- `docs/USAGE.md` — ProMemo usage guide, file organization
- `CHANGELOG.md` — ProMemo features in [Unreleased]

---

## Session 4 — 2026-02-07 — Parser Improvements, pgAdmin, Agents, and Location Data

### Summary

Addressed all parser gaps found from first real data test (An Cu Dean listings).
Added pgAdmin for database browsing, improved Vietnamese parser with smart
property type classification, default transaction types, road access and
furnishing extraction. Created agents table, Nha Trang location reference
tables (28 wards, 60 streets), and seeded Dean as first agent.

### Features Delivered

- pgAdmin 4 web UI (port 5050) with auto-configured app database connection
- Smart property type: title-first priority, "bán đất tặng nhà" compound override
- Default transaction_type to "ban" when listing has property info but no verb
- `access_road` extraction: mat_duong, hem_oto, hem_thong, hem_rong, hem_nho, hem
- `furnished` extraction: full, co_ban, khong
- `agents` table with Dean (Duy) seeded, all listings associated
- `nha_trang_wards` reference: 28 entries (20 phường + 8 xã, pre/post-merger)
- `nha_trang_streets` reference: 60 major streets + streets from listing data
- Comprehensive ward list in parser (was 19, now 28)
- Database migration 003 for existing databases
- Seed script for reference data and first agent
- 20 new tests (90 total, all passing)

### Architecture Decisions

- **Scoring-based property type extraction**: When both "đất" and "nhà" appear
  in a listing, check the title (first line) to determine the primary type.
  Compound patterns like "bán đất tặng nhà" are pre-checked as overrides.
  This fixes the main misclassification issue from real data.
- **Default to "ban" for listings with property info**: In Vietnamese RE,
  listings with price/area/type but no explicit "bán" or "cho thuê" are almost
  always for sale. Rentals consistently use "cho thuê". This eliminated all 12
  previously-null transaction types.
- **Access road as categorical, not free text**: Road access patterns map to
  a fixed set of categories (mat_duong > hem_oto > hem_thong > hem_rong >
  hem_nho > hem) ordered by accessibility. This enables future filtering and
  scoring (e.g., car-accessible properties score higher for families).
- **Both pre- and post-merger ward names**: Nha Trang merged several wards in
  Nov 2024. We store both old and new names since listings may reference either.
- **pgAdmin over psql**: Added pgAdmin to docker-compose for visual database
  browsing. More accessible for the user than docker exec + psql.

### Challenges

- Property type misclassification: "BÁN ĐẤT TẶNG NHÀ" was classified as "nhà"
  because "nhà" keywords appeared first in the map iteration order. Fixed with
  scoring + title priority approach.
- pgAdmin `.local` email domain rejected by newer pgAdmin versions. Changed to
  `@renhatrang.dev`.

### Recommendations

- After schema changes, prefer `docker compose down -v && up -d` for dev.
  Use migration SQL only for data you want to preserve.
- Run `src/db/seed_reference_data.sql` after fresh database creation to
  populate wards, streets, and agent data.
- When adding new listing sources, create an agent record first, then set
  `agent_id` during ingestion for proper attribution.
- The property feature list (emoji-prefixed lines) contains patterns for:
  legal status, amenities, direction/orientation, distance to beach, distance
  to market. User to decide which become schema fields.

### Test Results

- 90 passed, 0 failed (was 70 before this session)
- Ruff lint: all checks passed
- Re-parse results: 37/37 parsed (0 failed), avg confidence 0.903
  - Before: avg confidence 0.835, 12 null transaction types, 12 misclassified
  - After: avg confidence 0.903, 0 null transaction types, 0 misclassified

### Files Created/Modified

New files:
- `config/pgadmin-servers.json` — pgAdmin auto-configured server
- `src/db/seed_reference_data.sql` — reference data and agent seed
- `src/db/migrations/003_add_agents_access_road_furnished_locations.sql`

Modified:
- `docker-compose.yml` — added pgAdmin service
- `src/db/init_db.sql` — added agents, location reference tables, new columns
- `src/parsing/vietnamese_parser.py` — property type scoring, default txn type,
  access_road, furnished, comprehensive ward list
- `src/parsing/parse_listings.py` — includes new columns in INSERT
- `kestra/flows/re-nhatrang.parse-listings.yml` — synced inline parser
- `tests/test_vietnamese_parser.py` — 20 new tests
- `.env.example` — added pgAdmin variables
- `docs/ARCHITECTURE.md` — updated data model, added pgAdmin to diagrams
- `docs/USAGE.md` — added pgAdmin docs, updated Step 4, troubleshooting
- `CHANGELOG.md` — updated [Unreleased] section
- `CLAUDE.md` — updated session reference

---

## Session 3 — 2026-02-06 — Kestra Docker Runner and AI Copilot

### Summary

Configured Gemini AI Copilot in Kestra, then spent an extended debugging
session resolving a chain of Kestra Docker runner issues: storage permissions,
Docker socket access, Python version mismatch, container networking, and
log persistence. Ended with a fully working ingest + parse pipeline using
Docker runner task containers on the correct network.

### Features Delivered

- Gemini 2.5 Flash AI Copilot active in Kestra UI
- Docker runner properly configured for all script tasks (python:3.12-slim)
- Task containers connected to compose network (can reach app-postgres)
- Bidirectional flow sync script (`scripts/kestra_flow_sync.sh`)
- `full-pipeline` flow merged into `ingest-csv` with `auto_parse` toggle
- `demo-file-test` diagnostic flow for quick sanity checks
- Removed custom JSON log-writing from flows (rely on Kestra built-in logging)

### Architecture Decisions

- **Docker runner over Process runner**: Process runner uses Kestra container's
  Python 3.10 and can't pip install (permission denied). Docker runner spawns
  isolated containers with `python:3.12-slim`, proper root access, and clean
  dependency installation. Trade-off: ~15-30s overhead per task for container
  pull/start. Acceptable for manual-trigger V1 workflows.
- **Run Kestra as root**: Official Kestra Docker Compose approach. Required for
  Docker socket access (spawning task containers). The alternative (rootless)
  requires Podman, which adds complexity.
- **Explicit networkMode on task runner**: Docker runner containers default to
  Docker's bridge network, isolated from compose services. Must set
  `networkMode: re-nhatrang_re-nhatrang` to reach app-postgres and redis.
- **Remove custom JSON logs**: Docker runner task containers don't inherit
  the Kestra container's volume mounts, so writing to `/app/logs/kestra/`
  from inside a task container does nothing. Kestra's built-in execution
  logging (Executions tab + Logs tab showing print() output) is sufficient.
- **Merge full-pipeline into ingest-csv**: Eliminated a separate orchestrator
  flow. `ingest-csv` now has `auto_parse` boolean (default true) that
  conditionally triggers parse-listings as a subflow. Simpler, fewer flows,
  and avoids FILE-across-subflow complexity.

### Challenges

- **refCnt: 0 red herring**: The "Illegal state: refCnt: 0, decrement: 1"
  error consumed most of the session. Multiple AI tools (Claude Code, ChatGPT,
  Kestra AI Copilot) analyzed it as a FILE reference lifecycle issue. Actual
  cause: storage volume permissions. Running as root fixed it instantly.
  Lesson: always check the basics (permissions, network, runner config)
  before investigating framework internals.
- **Five cascading Docker runner issues**: After fixing permissions, each fix
  revealed the next problem — no Docker socket, then pip permission denied,
  then wrong Python version, then network isolation. Each required a different
  piece of docker-compose or flow YAML configuration.
- **Flow sync gap**: Changes made in Kestra UI don't sync back to host files.
  Deleting flow files from host doesn't remove them from Kestra's DB.
  Solved with the push/pull sync script using Kestra CLI.

### Recommendations

- Kestra `user: "root"` is mandatory for Docker runner (Docker socket access).
- Always set `networkMode` in task runner config when tasks need DB access.
- Docker network name follows pattern: `{compose-project}_{network-name}`.
- Use `containerImage: python:3.12-slim` on all script tasks.
- Use `engine.begin()` (not `engine.connect()`) for SQLAlchemy transactions.
- Use `runIf` (not `if`) for conditional task execution in Kestra flows.
- Push flows after editing: `KESTRA_USER=... ./scripts/kestra_flow_sync.sh push`
- Kestra's built-in Logs tab captures all `print()` output from script tasks.

### Test Results

- No new unit tests (infrastructure/config session).
- Full pipeline tested via API: ingest-csv (2 rows) + parse-listings both SUCCESS.
- Parser confidence: 1.0 on both test listings (nhà phố sell + căn hộ rent).

### Files Created/Modified

New files:
- `kestra/flows/re-nhatrang.demo-file-test.yml` — diagnostic flow
- `scripts/kestra_flow_sync.sh` — bidirectional flow sync

Modified:
- `docker-compose.yml` — Gemini API key, AI copilot config, Docker socket,
  shared temp dir, `user: "root"`, tmpDir config
- `kestra/flows/re-nhatrang.ingest-csv.yml` — Docker runner, networkMode,
  auto_parse toggle, subflow call, removed custom log writing
- `kestra/flows/re-nhatrang.parse-listings.yml` — Docker runner, networkMode,
  engine.begin(), removed custom log writing
- `.env.example` — added KESTRA_USER and ENV_GEMINI_API_KEY
- `docs/TESTING_LOG.md` — session 3 test observations
- `docs/ARCHITECTURE.md` — added infrastructure diagram
- `docs/USAGE.md` — updated for current flow structure, removed JSON log docs
- `CLAUDE.md` — updated session reference
- `CHANGELOG.md` — added [Unreleased] block

Deleted:
- `kestra/flows/re-nhatrang.full-pipeline.yml` — merged into ingest-csv

---

## Session 2 — 2026-02-05 — Execution Logging and Backup/Restore

### Summary

Added observability infrastructure: automatic execution logging from Kestra
flows, a CLI log viewer, Kestra database backup/restore with auto-rehydration
on startup, and human testing documentation.

### Features Delivered

- `docs/TESTING_LOG.md` — human-authored testing journal with template
- `docs/SESSION_LOG.md` — coding session history (this file)
- `logs/kestra/` — auto-generated JSON execution logs from Kestra flows
- `logs/kestra/backups/` — Kestra Postgres backup storage
- `scripts/show_execution_log.py` — CLI viewer for execution logs
  (supports `--last N`, `--flow`, `--failures` filters)
- `scripts/backup_kestra_db.sh` — on-demand Kestra DB backup with retention pruning
- `scripts/restore_kestra_db.sh` — restore script used by init container
- `kestra-restore` init container in docker-compose — auto-restores latest
  backup into fresh Kestra DB on startup
- Kestra flows now emit JSON summaries with row counts, success rates,
  and sample failure details
- Updated `docs/USAGE.md` with logging, backup, and restore documentation

### Architecture Decisions

- **Dual logging strategy**: Kestra UI retains execution history in its own
  Postgres (volatile — lives in Docker volume). JSON files in `logs/kestra/`
  persist in the repo and survive volume wipes.
- **Init container for restore**: `kestra-restore` runs once on `docker compose up`,
  checks if Kestra DB is empty, restores from latest backup if available,
  then exits. Zero-friction — no manual intervention needed.
- **Backup is manual, restore is automatic**: Backups require explicit
  `./scripts/backup_kestra_db.sh` (intentional — you choose when to snapshot).
  Restore is automatic on fresh DB detection (safe — only runs when DB is empty).
- **Separate human and machine logs**: `docs/TESTING_LOG.md` for observations,
  `logs/kestra/` for machine data. Different audiences, different formats.

### Challenges

- Kestra script tasks run in isolated containers and cannot write directly to
  host filesystem. Solved by mounting `./logs/kestra` as a volume into the
  Kestra container at `/app/logs/kestra`.
- Parse-listings flow needed a second DB connection to query sample failures
  after the main transaction committed.

### Recommendations

- Run `./scripts/backup_kestra_db.sh` before any `docker compose down -v`.
- JSON execution logs are git-tracked (repo is private). Revisit if repo
  goes public — may want to gitignore `logs/kestra/*.json`.
- `KESTRA_BACKUP_DAYS` env var controls both backup pruning and restore
  eligibility window (default: 30 days).

### Test Results

- No new tests in this session (infrastructure/config changes only).
- Existing 57 tests still passing.

### Files Created/Modified

New files:
- `docs/TESTING_LOG.md`
- `docs/SESSION_LOG.md`
- `logs/kestra/.gitkeep`
- `logs/kestra/backups/.gitkeep`
- `scripts/show_execution_log.py`
- `scripts/backup_kestra_db.sh`
- `scripts/restore_kestra_db.sh`

Modified:
- `docker-compose.yml` — added logs volume mount, kestra-restore init container
- `kestra/flows/re-nhatrang.ingest-csv.yml` — added JSON log output step
- `kestra/flows/re-nhatrang.parse-listings.yml` — added JSON log output step
- `.env.example` — added `KESTRA_BACKUP_DAYS`
- `docs/USAGE.md` — added logging, backup, restore, and testing docs sections
- `CLAUDE.md` — updated session documentation, added session 2 recommendations

---

## Session 1 — 2026-02-05 — V1 MVP Implementation

### Summary

Implemented the full V1 MVP: manual CSV ingestion pipeline with Vietnamese
regex-based listing parser, orchestrated by Kestra, backed by PostgreSQL
with pgvector.

### Features Delivered

- Docker Compose environment (Kestra + App Postgres + Kestra Postgres + Redis)
- Zalo text-to-CSV transformer (`src/ingestion/zalo_transformer.py`)
- CSV validator and database loader (`src/ingestion/csv_loader.py`)
- Vietnamese listing parser with regex extraction (`src/parsing/vietnamese_parser.py`)
- Parse orchestration module (`src/parsing/parse_listings.py`)
- 3 Kestra flows: `ingest-csv`, `parse-listings`, `full-pipeline`
- CLI scripts: `transform_zalo_export.py`, `seed_sample_data.py`
- Sample data: 8 example listings in both raw text and CSV format
- 57 tests (all passing)

### Architecture Decisions

- **Kestra over Celery for V1**: Kestra provides a UI for manual CSV upload and
  flow triggering out of the box. Celery would require building a separate
  upload mechanism. Celery/Redis kept in plan for V1.1+ async processing.
- **Separate Postgres instances**: Kestra gets its own Postgres to isolate
  metadata from application data. App Postgres uses pgvector image for
  future embedding support.
- **Inline scripts in Kestra flows**: Kestra script tasks run in isolated
  containers. The parser logic is duplicated inline in the Kestra flow YAML
  rather than importing from `src/`. Trade-off: duplication vs. simplicity.
  Acceptable for V1; revisit when parser logic grows.
- **Regex-based parser**: No LLM dependency for V1. Handles common Vietnamese
  listing patterns. LLM augmentation deferred to V2.

### Challenges

- No official Zalo API for reading group messages. V1 works around this with
  manual copy-paste and text file transformation.
- Vietnamese text has many spelling variants (with/without diacritics,
  abbreviations). Parser handles common variants but not exhaustive.

### Recommendations

- Kestra flows must use inline Python scripts, not project imports.
- Parser confidence score = extracted fields / 5 key fields.
- When adding new Vietnamese keywords to the parser, add both diacritics
  and non-diacritics forms.
- `uv` is the package manager; venv lives at `.venv/`.

### Test Results

- 57 passed, 0 failed
- Ruff lint: all checks passed

### Files Created

26 new files — see git log for full list.

---

<!-- Template for new sessions:

## Session N — YYYY-MM-DD — Brief Title

### Summary

One paragraph: what was the goal and what was accomplished.

### Features Delivered

- Bullet list of user-facing features or capabilities added.

### Architecture Decisions

- Decision made and rationale. Include trade-offs considered.

### Challenges

- Problems encountered and how they were resolved.

### Recommendations

- Tips, gotchas, things to keep in mind for future sessions.

### Test Results

- Pass/fail counts and any notable coverage changes.

### Files Created/Modified

- Summary of structural changes to the codebase.

-->
