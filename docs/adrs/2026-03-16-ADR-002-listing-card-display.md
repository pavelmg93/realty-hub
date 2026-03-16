# ADR 002: Listing Card Display — title_standardized, Status Badges, Feed Visibility

**Date:** 2026-03-16
**Status:** Accepted

---

## Context / Problem

Listing cards across Feed and My Listings have three display decisions to lock in
before Session 15 UI work begins:

1. What is the primary text on a card thumbnail?
2. When and where do status badges appear?
3. Which listings are visible in the Feed?

These decisions affect `FeedCard`, `ListingCard`, the feed API query, and
`StatusBadge` — all must behave consistently across views.

---

## Decision 1 — Card Headline: Two-Line Display

**Chosen:** Two-line large-font display, same font weight as the current price headline.
```
Line 1:  <address_raw>
Line 2:  <area_m2>m² <num_floors>T <frontage_m>x<depth_m> <commission> <price-short>
```

Example:
```
34/2 Nguyen Thien Thuat
100m² 7T 10x10 hh1 20ty
```

**Implementation:**
- Line 2 is the stored `title_standardized` column (minus the address prefix,
  which is now on line 1).
- `buildTitleStandardized()` in `web/src/lib/listing-utils.ts` generates and
  stores only the line 2 portion: `<price-short> <commission> <area_m2>m² <num_floors>T <frontage_m>x<depth_m>`.
- Address is always rendered separately from the DB `address_raw` column.
- Null-safe: if any dimension is null, omit it from line 2 gracefully.
- Truncate both lines with `truncate` (single line) or `line-clamp-1` to
  prevent card height explosion on long Vietnamese addresses.

**Rationale:** Price first on line 2 is the most important scan signal after
address. Commission (hh1 etc.) is context agents need immediately. Dimensions
follow as secondary detail. This order matches how agents verbally describe
listings: "20 tỷ, hh1, 100m²..."

---

## Decision 2 — Status Enum Reduced to 7

**Removed:** `in_negotiations` and `pending_closing` — both were rendering as
"Open" due to missing i18n keys, indicating they are not meaningfully distinct
in the current workflow.

**Final 7 valid statuses:**

| DB value | EN label | VI label | Badge color |
|---|---|---|---|
| `just_listed` | Just Listed | Mới Đăng | `#16A34A` green |
| `for_sale` | For Sale | Đang Bán | *(no badge)* |
| `price_dropped` | Price Drop | Giảm Giá | `#CA8A04` amber |
| `price_increased` | Price Up | Tăng Giá | `#7C3AED` purple |
| `deposit` | Deposit | Đặt Cọc | `#E87722` orange |
| `sold` | Sold | Đã Bán | `#DC2626` red |
| `not_for_sale` | Not For Sale | Không Bán | `#64748B` gray |

**Migration 012** updates the DB CHECK constraint and migrates existing rows:
```sql
ALTER TABLE parsed_listings DROP CONSTRAINT parsed_listings_status_check;
ALTER TABLE parsed_listings ADD CONSTRAINT parsed_listings_status_check
  CHECK (status IN (
    'just_listed','for_sale','price_dropped','price_increased',
    'deposit','sold','not_for_sale'
  ));
UPDATE parsed_listings
  SET status = 'for_sale'
  WHERE status IN ('in_negotiations','pending_closing');
ALTER TABLE agents ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
```

*(`avatar_url` bundled in migration 012 as a low-risk additive change.)*

---

## Decision 3 — Status Badges on Thumbnails

**Rule:** Badge appears top-left of photo area for all statuses **except `for_sale`**.
No badge on `for_sale` — absence of badge = implicitly active/available listing.

Badge is a small pill (`px-2 py-0.5 rounded-full text-xs font-semibold`) overlaid
on the photo. If no photo, badge sits top-left of the card header area.

---

## Decision 4 — Feed Visibility Rules

**Rule:**
- `sold` and `not_for_sale` are hidden from Feed by default
- Exception: visible if the current agent has favorited the listing
- My Listings always shows all statuses (agent sees full portfolio)
- Archived listings (`archived_at IS NOT NULL`) always hidden from both views

**Feed API WHERE clause:**
```sql
WHERE pl.archived_at IS NULL
  AND (
    pl.status NOT IN ('sold', 'not_for_sale')
    OR lf.agent_id = $currentAgentId
  )
```

Where `lf` is a LEFT JOIN on `listing_favorites` filtered to the current agent.
This join is already present for the favorites filter — extend it, don't add a
second join.

---

## Consequences

**Positive:**
- 7-status enum is cleaner and maps directly to visible workflow stages
- Two-line card headline maximizes information density without opening the listing
- Feed hides noise (sold/NFS) while preserving favorites access

**Negative / Risks:**
- Existing rows with `in_negotiations` or `pending_closing` status are migrated
  to `for_sale` — agents will lose that status granularity on historical listings.
  Acceptable: these two statuses were non-functional (rendered as "Open") so
  no real data is lost.
- Long Vietnamese addresses may overflow line 1 even with truncation on narrow
  mobile cards. Mitigation: `line-clamp-1` + `title` attribute for hover tooltip.