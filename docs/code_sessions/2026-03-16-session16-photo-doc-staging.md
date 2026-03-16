# Session 16: Photo & Document Upload at Listing Creation
**Date:** 2026-03-16

### Summary
Added photo and document upload to the New Listing form using a staging pattern. Files upload to disk immediately but register with the listing only after creation succeeds.

### Technical Details
* **Staging pattern:** PhotoUploader and DocumentManager now support two modes via discriminated union props:
  - **Registered mode** (`listingId` provided): existing behavior, uploads + registers in DB
  - **Staging mode** (no `listingId`): uploads to `/api/upload` only, parent holds metadata in state
* **ListingForm.handleSave:** After POST `/api/listings` returns the new listing ID, loops through `stagedPhotos` and `stagedDocuments` to register each via existing `/api/listings/{id}/photos` and `/api/listings/{id}/documents` endpoints
* **New types:** `StagedPhoto` (file_path, original_name, file_size) and `StagedDocument` (adds file_name, mime_type, category, notes)
* **i18n:** Added `clickOrDragPhotos`, `uploading` keys (en/vi)

### Files Touched
- `web/src/lib/types.ts` — added StagedPhoto, StagedDocument interfaces
- `web/src/lib/i18n.ts` — added clickOrDragPhotos, uploading keys
- `web/src/components/photos/PhotoUploader.tsx` — refactored for staging/registered modes
- `web/src/components/documents/DocumentManager.tsx` — refactored for staging/registered modes
- `web/src/components/listings/ListingForm.tsx` — added photo + document sections, post-save registration
- `docs/SCOPE.md` — P2 photos + documents checked off
- `docs/CHANGELOG.md` — session 16 additions
