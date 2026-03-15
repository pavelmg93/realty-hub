# ADR 001: New Listing Form — AI-Assisted Parse Architecture

**Date:** 2026-03-16  
**Status:** Accepted  
**Author:** Pavel + Claude  

---

## Context / Problem

The current New Listing page has a server error on submit and no photo management. More fundamentally, the form does not reflect the full `parsed_listings` schema and has no AI-assisted field extraction — which is the centerpiece feature of the demo.

We need to decide how the "Parse with AI" flow works end-to-end: what gets written to the DB at each step, what happens if the user abandons mid-flow, and how Gemini's structured output maps to form state without creating orphaned rows.

Constraints:
- Gemini 1.5 Flash free tier (15 RPM, 1M TPD) — must minimize API calls
- Python parser runs as a subprocess from the Next.js server (not a separate service)
- `raw_listings` and `parsed_listings` are separate tables by design; the existing pipeline writes both
- The form must work even if Gemini is unavailable (fallback to Python parser output only)

---

## Considered Options

**Option A: Eager DB write — create `raw_listings` row on Parse button click, create `parsed_listings` row on Create Listing button click.**

**Option B: Lazy DB write — hold all state in React form state until Create Listing; write both rows in a single API call at the end.**

**Option C: Two-step with staged row — write `raw_listings` on Parse, write a draft `parsed_listings` row immediately (status = `draft` or similar), promote to active on Create Listing.**

---

## Decision

**Option A: Eager `raw_listings`, deferred `parsed_listings`.**

On "Parse with AI" button click:
1. POST to `/api/raw-listings` → INSERT into `raw_listings` (source = `'web_form'`), return `raw_listing_id`.
2. Server calls Python parser subprocess synchronously → returns partial structured fields.
3. Server calls Gemini 1.5 Flash with the raw text + partial fields → returns full structured JSON.
4. Return merged result to client; client prefills form fields with confidence indicators.

On "Create Listing" button click:
5. POST to `/api/listings` → INSERT into `parsed_listings` with `raw_listing_id` FK, all form fields, `status = 'just_listed'`, auto-generated `title_standardized`.

---

## Rationale

Option A preserves the existing pipeline contract (`raw_listings` → `parsed_listings`). It means every submitted listing has a traceable raw input — important for debugging parser quality. Option B loses the audit trail. Option C adds DB complexity (draft rows, cleanup jobs) that is unnecessary for a 3-user demo.

Gemini and the Python parser are called **in the same API request** (not separate round-trips) to minimize latency and API quota usage, consistent with ROADMAP-v2 §2.3.

The Python parser runs first because it is free and fast; its output is passed to Gemini as context so Gemini only needs to fill gaps and generate the description draft + follow-up questions — not re-extract everything from scratch.

---

## API Contract

### `POST /api/ai/parse-listing`

**Input:**
```json
{
  "text": "string",
  "raw_listing_id": "integer (already inserted)",
  "photos": ["base64 optional"]
}
```

**Output:**
```json
{
  "fields": { "price_vnd": 0, "area_m2": 0, "ward": "", "...": "..." },
  "confidence": { "price_vnd": 0.95, "ward": 0.7 },
  "description_draft": "Vietnamese description string",
  "follow_up_questions": [
    { "field": "legal_status", "question_vi": "Sổ đỏ hay sổ hồng?", "question_en": "Red book or pink book?" }
  ],
  "duplicate_warning": { "found": false, "listing_id": null, "similarity": 0 }
}
```

### `POST /api/listings` (existing, extend)

Add `raw_listing_id`, `title_standardized`, `commission` to INSERT. Auto-generate `title_standardized` server-side using helper:
```typescript
// web/src/lib/listing-utils.ts
export function buildTitleStandardized(l: Partial<ParsedListing>): string {
  const price = formatPriceShort(l.price_vnd);
  const dims = l.frontage_m && l.depth_m ? `${l.frontage_m}x${l.depth_m}` : '';
  return [l.address_raw, l.area_m2, l.num_floors, dims, price, l.commission ?? 'hh1']
    .filter(Boolean).join(' ');
}
```

---

## Consequences

**Positive:**
- Full audit trail: every AI-assisted listing has a `raw_listings` row to trace parse quality.
- Single Gemini call per Parse action — stays within free tier for demo.
- Fallback is clean: if Gemini errors, return Python parser output only; user can still manually fill remaining fields.
- `title_standardized` is always server-generated, never user-editable — no inconsistency.

**Negative / Risks:**
- Orphaned `raw_listings` rows if user clicks Parse but never clicks Create Listing. 
- Python subprocess from Next.js adds ~200-500ms latency and couples the web container to the Python source tree.

**Mitigation:**
- Orphaned rows: acceptable for demo (3 users, low volume). Add a cleanup cron post-MVP.
- Subprocess latency: show a loading spinner; the UX already expects a multi-second wait for AI. For MVP, extract parser to a dedicated microservice or FastAPI endpoint.