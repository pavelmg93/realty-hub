# Session: Maps, Photos, Documents, Auth Cleanup
**Date:** 2026-02-12

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
