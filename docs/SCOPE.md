# Realty Hub — Project Scope
**Sprint:** Post-Pilot UX Redesign
**Phase:** Card redesign + Form overhaul + Listing detail fix
**Version:** v1.2

---

## 🔴 Current Session: 26 — Card Redesign, Form Overhaul, Title Fix

**Branch:** `main` (direct commits)
**Linear:** REA-65, REA-66, REA-67
**ADR:** ADR-005 (title_standardized two-line canonical format — READ BEFORE CODING)
**Stitch reference:** `stitch_property_details_view/stitch_my_inventory/` (code.html, screen.png, DESIGN.md)
**Goal:** Fix listing detail title sizing, redesign 1-wide cards to horizontal Stitch layout, rebuild Add/Edit Listing form with new field order + commission + ward cascading.

### CRITICAL: Two-Line Title Rule (ADR-005)

Every listing title everywhere in the app is TWO lines, displayed as one atomic unit with IDENTICAL font size, weight, and color:

```
Line 1: listing.street          ← e.g., "16/3 Hùng Vương"
Line 2: listing.title_standardized  ← e.g., "49 1 5.5 9 6.ty hh1"
```

- Line 1 source is `listing.street` — NOT `address_raw`, NOT `ward`, NO fallback concatenation
- `address_raw` is RETIRED from all UI. It stays in DB but is never displayed.
- If `street` is empty, line 1 is empty. Do NOT substitute.
- Line 2: `listing.title_standardized || generateTitleStandardized(listing)` — the ONLY permitted computation

### Tasks (execute top-down)

#### Quick fix (do first — 5 minutes)

* [x] **[Listing detail title sizing — REA-66]** Both title lines in listing detail page must use IDENTICAL CSS classes: `text-2xl sm:text-3xl font-bold text-[var(--text-primary)]`. Line 1 source: `listing.street || ""`. Line 2 source: `listing.title_standardized || generateTitleStandardized(listing)`. Remove any reference to `address_raw` in the title block.

#### Card redesign

* [x] **[1-wide horizontal card — REA-65]** Redesign 1-wide listing cards in Feed and My Listings. Read `stitch_property_details_view/stitch_my_inventory/code.html` and `screen.png` for reference layout. Keep our dark theme + CSS variables. Layout:
    ```
    ┌──────────────────────────────────────────┐
    │ ┌─────────┐ [StatusBadge] #id            │
    │ │  PHOTO  │ listing.street (line 1)      │
    │ │  1/3w   │ title_standardized (orange)   │
    │ │         │ 📍 Ward                       │
    │ │         │ 👤 Agent Name                 │
    │ ├─────────┤ 📞 Phone (tel: link)    ❤️   │
    │ │ status  │                              │
    │ └─────────┘                              │
    └──────────────────────────────────────────┘
    ```
    - Title line 1: `listing.street` — NOT `address_raw`
    - Title line 2: `listing.title_standardized || generateTitleStandardized(listing)` in `text-[var(--orange)]` bold
    - Ward shown separately as metadata (📍 icon line), NOT in the title
    - Photo: `w-1/3 h-full object-cover`, status label strip at bottom of photo column
    - Info lines: `text-sm text-[var(--text-secondary)]` with lucide icons (`MapPin`, `User`, `Phone`)
    - Card height: `h-[180px]` mobile, `h-[200px]` desktop
    - Apply to `ui/ListingCard.tsx` (cols===1), `FeedCard.tsx`, `listings/ListingCard.tsx` (cols===1)
    - 2-wide grid keeps current vertical card layout (but also uses `listing.street` for line 1)
    - Remove: "updated" footer, action buttons row
    - Per ADR-005: no inline `buildSpecsLine()`, no `address_raw` references

#### Form overhaul (biggest task)

* [x] **[Add/Edit Listing form — REA-67]** Complete form rebuild. Field order per wireframe:
    1. Description Raw textarea → Paste + Parse w/ AI buttons
    2. Property Type | Transaction Type | Legal Status (dropdowns, one row)
    3. Price | Area m² | P/m² auto-calc (one row)
    4. Commission: radio `% | Months` + numeric input → auto-generates `commission` display column
    5. Street Address (single field → writes to `street` column. `address_raw` hidden from UI, kept in DB)
    6. Old Ward ↕ | New Ward ↕ (cascading: old→auto-fills new; new→clears old + filters old list)
    7. Map with auto-pin + manual drag
    8. Frontage | Depth (2-col)
    9. Bedrooms | Bathrooms (2-col)
    10. Floors | Total Area (2-col)
    11. Photo Uploader
    12. Document Uploader
    13. Extras: Bldg Age | Access Road | Elevator | Furnished | Direction | Corner Lot | Income | Traffic (2-col)

    **DB migrations required:**
    - `commission_pct NUMERIC` on `parsed_listings`
    - `commission_months SMALLINT` on `parsed_listings`
    - `ward_new VARCHAR(100)` on `parsed_listings`
    - `new_ward VARCHAR(100)` + `is_legacy BOOLEAN DEFAULT true` on `nha_trang_wards`
    - Seed: 4 new wards + legacy→new mapping
    - Address consolidation: compare `address_raw` vs `street`, keep longer, write to BOTH columns (one-time migration to sync them)

    **Utility functions:**
    - `generateCommissionDisplay(pct, months)` → `"hh1"`, `"mm2"`, etc.
    - Ward mapping lookup (old→new, new→old-list)

    **Also update Edit Listing form** — same layout and behavior.

---

## ✅ Completed (Sessions 25 + 25b)

* [x] REA-57: title_standardized zombie killed
* [x] REA-53: Feed message routing fixed
* [x] REA-54: Conversation scroll fixed
* [x] REA-55: Conversation header redesign
* [x] REA-56: Message bubble icon
* [x] REA-58: Duplicate photos removed
* [x] REA-59: Feed header + city selector + migration 017
* [x] REA-60: Map height fixed
* [x] REA-61: Listing detail layout linearized
* [x] REA-62: CLAUDE.md updates
* [x] REA-64: migrate.sh self-heal + script permissions

---

## 🧊 Backlog

* [ ] Migrate photos to GCS — REA-18
* [ ] Notifications — REA-20
* [ ] API rate limiting — REA-21
* [ ] JWT expiry + refresh tokens
* [ ] Cloud Run / Cloud SQL migration
* [ ] CRM: person profile docs + deal events
* [ ] pgvector semantic search
* [ ] Public listing pages — `/l/[id]?token=xxx`
* [ ] Cloudflare SSL Full (Strict)
* [ ] Feed FTS — REA-13
* [ ] Share card image — REA-14
* [ ] Gemini OCR — REA-12
* [ ] Pilot accounts — REA-8
* [ ] DB sync script — REA-63
* [ ] Remove ~/re-nhatrang/ from VM — REA-51
