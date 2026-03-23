# ADR 005: title_standardized — Canonical Format and Single-Source Rendering

**Date:** 2026-03-23  
**Status:** Accepted  
**Supersedes:** ADR-002 (Decision 1 — Card Headline)  
**Author:** Pavel + Claude  

---

## Context / Problem

ADR-002 established a two-line card display with `title_standardized` as line 2. The original spec used suffixes (`m²`, `T`) and `x` between dimensions. Over Sessions 21–25, the format was updated to remove these suffixes, but the fix was applied only to `generateTitleStandardized()` in `constants.ts` and via SQL regex-patch migrations.

**The actual rendering was never fixed.** Three card components (`ListingCard.tsx`, `FeedCard.tsx`, `ui/ListingCard.tsx`) each contain their own inline `buildSpecsLine()` functions that hardcode the OLD format with `m²`, `T`, and `x`. These functions bypass `title_standardized` entirely — they recompute line 2 from raw fields every render.

This caused a 4-session zombie bug where the "fix" kept being applied to the wrong layer (DB values and the generation function) while the display layer ignored both.

---

## Decision

### 1. Canonical format for `title_standardized`

```
<area> <floors> <frontage> <depth> <price> <commission>
```

Example: `49 1 5.5 9 6.ty hh1`

**Rules:**
- NO suffixes: no `m²`, no `T`, no `x`
- NO address, ward, street, district, or property type
- Null fields are silently omitted
- Price before commission
- `commission` defaults to `hh1` if null

### 2. Single source of truth for rendering

**`generateTitleStandardized()`** in `web/src/lib/constants.ts` is the ONLY function that may produce the specs line. 

**All inline `buildSpecsLine()` functions must be deleted.** Specifically:
- `web/src/components/listings/ListingCard.tsx` — inline `line2Parts` builder
- `web/src/components/feed/FeedCard.tsx` — `buildSpecsLine()`
- `web/src/components/ui/ListingCard.tsx` — `buildSpecsLine()`

**Card rendering rule:**
```typescript
const line1 = listing.address_raw || "";
const line2 = listing.title_standardized || generateTitleStandardized(listing);
```

No other computation of line 2 is permitted in any component.

### 3. Two-line display

Every surface that shows a listing headline uses the same two-line format:

```
Line 1: address_raw (or street + ward fallback)
Line 2: title_standardized (from DB, or computed via generateTitleStandardized)
```

This applies to: Feed cards, My Listings cards, listing detail page header, conversation property bars, share card text.

### 4. Regeneration on save and deploy

- **On listing create/edit:** API recomputes `title_standardized` via `generateTitleStandardized()` before INSERT/UPDATE.
- **On deploy:** `scripts/regenerate-titles.sh` runs after migrations, recomputing all rows from source columns. This ensures any format change propagates to all existing data automatically.

---

## Rationale

The root cause of the zombie bug was duplication: the format spec existed in 4+ places (the generation function, three inline builders, the DB column, and ADR-002). When the spec changed, only 1 of 4 places was updated. Single-source eliminates this class of bug entirely.

Regeneration on deploy means we never need another "fix stale title" migration again.

---

## Consequences

**Positive:**
- One function, one format, everywhere — no more format drift
- Deploy auto-heals any stale data
- Future format changes require updating ONE function + deploying

**Negative / Risks:**
- Cards without `title_standardized` in the API response will call `generateTitleStandardized()` on every render (minor perf cost, acceptable)
- `regenerate-titles.sh` adds ~1-2s to deploy for current data volume

**Mitigation:**
- Ensure all listing APIs return `title_standardized` so the client-side fallback rarely fires
- Regeneration script is idempotent and fast at current scale
