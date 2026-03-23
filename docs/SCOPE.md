# Realty Hub — Project Scope
**Sprint:** Post-Pilot UX Redesign
**Phase:** Card redesign + Form overhaul + Listing detail fix
**Version:** v1.2

---

## 🔴 Current Session: 26 — Card Redesign, Form Overhaul, Title Fix

**Branch:** `main` (direct commits)
**Linear:** REA-65, REA-66, REA-67
**ADR:** ADR-005 (title_standardized canonical format — read for context on title rendering rules)
**Stitch reference:** `stitch_property_details_view/stitch_my_inventory/` (code.html, screen.png, DESIGN.md)
**Goal:** Fix listing detail title sizing, redesign 1-wide cards to horizontal Stitch layout, rebuild Add/Edit Listing form with new field order + commission + ward cascading.

### Tasks (execute top-down)

#### Quick fix (do first — 5 minutes)

* [ ] **[Listing detail title sizing — REA-66]** Both title lines in listing detail page must use IDENTICAL CSS classes. Currently address is `text-sm text-secondary` (tiny) while specs is `text-2xl bold` (huge). Fix: make BOTH lines `text-2xl sm:text-3xl font-bold text-[var(--text-primary)]`. Same size, same weight, same color — match thumbnail card appearance.

#### Card redesign

* [ ] **[1-wide horizontal card — REA-65]** Redesign 1-wide listing cards in Feed and My Listings. Read `stitch_property_details_view/stitch_my_inventory/code.html` and `screen.png` for reference layout. Keep our dark theme + CSS variables. Layout:
    ```
    ┌──────────────────────────────────────────┐
    │ ┌─────────┐ [StatusBadge] #id            │
    │ │  PHOTO  │ address_raw                  │
    │ │  1/3w   │ title_standardized (orange)   │
    │ │         │ 📍 Ward                       │
    │ │         │ 👤 Agent Name                 │
    │ ├─────────┤ 📞 Phone (tel: link)    ❤️   │
    │ │ status  │                              │
    │ └─────────┘                              │
    └──────────────────────────────────────────┘
    ```
    - Photo: `w-1/3 h-full object-cover`, status label strip at bottom of photo column
    - Title: `text-[var(--orange)]` bold — visual anchor
    - Address: `text-[var(--text-primary)]`
    - Info lines: `text-sm text-[var(--text-secondary)]` with lucide icons (`MapPin`, `User`, `Phone`)
    - Card height: `h-[180px]` mobile, `h-[200px]` desktop
    - Apply to `ui/ListingCard.tsx` (cols===1), `FeedCard.tsx`, `listings/ListingCard.tsx` (cols===1)
    - 2-wide grid keeps current vertical card layout
    - Remove: "updated" footer, action buttons (live in listing detail now)
    - Per ADR-005: `line2 = listing.title_standardized || generateTitleStandardized(listing)` — no inline builders

#### Form overhaul (biggest task)

* [ ] **[Add/Edit Listing form — REA-67]** Complete form rebuild. Field order per wireframe (see issue for full spec):
    1. Description Raw textarea → Paste + Parse w/ AI buttons
    2. Property Type | Transaction Type | Legal Status (dropdowns, one row)
    3. Price | Area m² | P/m² auto-calc (one row)
    4. Commission: radio `% | Months` + numeric input → auto-generates `commission` display column
    5. Street Address (single field, hidden `address_raw`)
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
    - Address consolidation: compare `address_raw` vs `street`, keep longer, write to both

    **Utility functions:**
    - `generateCommissionDisplay(pct, months)` → `"hh1"`, `"mm2"`, etc.
    - Ward mapping lookup (old→new, new→old-list)

    **Also update Edit Listing form** — same layout and behavior.

---

## ✅ Completed (Sessions 25 + 25b)

* [x] REA-57: title_standardized zombie killed — deleted inline buildSpecsLine(), single source via generateTitleStandardized()
* [x] REA-53: Feed message routing fixed — all paths → listing detail #messages
* [x] REA-54: Conversation scroll — scrolls to latest message
* [x] REA-55: Conversation header redesign — agent bar + property bar, no duplicates
* [x] REA-56: Message bubble icon everywhere
* [x] REA-58: Duplicate photos removed — view=carousel, edit=manage
* [x] REA-59: Feed header + city selector + migration 017
* [x] REA-60: Map height fixed
* [x] REA-61: Listing detail layout — removed price block, linearized
* [x] REA-62: CLAUDE.md — deployment reminder, ADR rules, script permissions
* [x] REA-64: migrate.sh self-heal + deploy-vm.sh chmod +x

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
* [ ] Cloudflare SSL Full (Strict) — origin cert
* [ ] Feed FTS — REA-13
* [ ] Share card image generator — REA-14
* [ ] Gemini image/OCR parsing — REA-12
* [ ] Create pilot accounts — REA-8
* [ ] DB sync script — REA-63
* [ ] Remove stale ~/re-nhatrang/ from VM — REA-51
