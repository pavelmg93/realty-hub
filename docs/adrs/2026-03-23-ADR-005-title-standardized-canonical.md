# ADR 005: Standardized Title — Two-Line Canonical Format and Single-Source Rendering

**Date:** 2026-03-23  
**Status:** Accepted  
**Supersedes:** ADR-002 (Decision 1 — Card Headline)  
**Author:** Pavel + Claude  

---

## Context / Problem

The "standardized title" is the primary identifier for a listing across the entire app. It must look identical everywhere — thumbnail cards, listing detail page, conversation property bars, share text. Previous sessions failed to enforce this because: (1) the spec was ambiguous about whether "title" meant one line or two, (2) three components had inline builders that bypassed the canonical function, and (3) fallbacks injected ward/street data into the specs line.

---

## Decision

### The standardized title is ALWAYS two lines displayed together

```
Line 1: <street-address>
Line 2: <area> <floors> <frontage> <depth> <price> <commission>
```

**Example:**
```
16/3 Hùng Vương
49 1 5.5 9 6.ty hh1
```

**This is one atomic unit.** Both lines are always shown together, with identical font size, weight, and color. They are never split, reordered, or styled differently from each other.

### Line 1 rules: `street` column (the address)
- Source: `listing.street` (the consolidated street address field)
- Content: house number + street name, e.g., "11 Vo Thi Sau", "16/3 Hùng Vương"
- NO ward, NO district, NO city — those are separate metadata, not part of the title
- NO fallback to `address_raw` or `ward` or `street + ward` concatenation
- If `street` is empty, line 1 is simply empty — do NOT substitute other fields

### Line 2 rules: `title_standardized` column (the specs)
- Source: `listing.title_standardized`, computed by `generateTitleStandardized()`
- Format: `<area> <floors> <frontage> <depth> <price> <commission>`
- NO suffixes: no `m²`, no `T`, no `x` separator
- NO address, ward, street, district, city, or property type
- Null fields silently omitted
- Price before commission
- `commission` defaults to `hh1` if null
- If `title_standardized` is null, call `generateTitleStandardized(listing)` — the ONLY permitted fallback

### Single source of truth

**`generateTitleStandardized()`** in `web/src/lib/constants.ts` is the ONLY function that produces line 2.

**All inline `buildSpecsLine()` functions are DELETED.** No component may compute the specs line independently. Every component uses:
```typescript
const line1 = listing.street || "";
const line2 = listing.title_standardized || generateTitleStandardized(listing);
```

### Where the two-line title appears (identical styling everywhere)

| Surface | Line 1 + Line 2 styling |
|---|---|
| Feed cards (1-wide) | Both lines bold, same size |
| Feed cards (2-wide) | Both lines bold, same size |
| My Listings cards | Both lines bold, same size |
| Listing detail page header | Both lines `text-2xl sm:text-3xl font-bold text-[var(--text-primary)]` |
| Conversation property bar | Both lines, smaller but still matched |
| Share card text | Both lines in generated text |

### Regeneration

- **On listing create/edit:** API recomputes `title_standardized` via `generateTitleStandardized()` before INSERT/UPDATE
- **On deploy:** `scripts/regenerate-titles.sh` runs after migrations, recomputing all rows from source columns

---

## Consequences

**Positive:**
- One function, one format, identical everywhere — no drift possible
- Deploy auto-heals stale data
- No ambiguity about what "the title" means — it's always two lines

**Negative / Risks:**
- Listings without a `street` value show a blank line 1 — acceptable, prompts agents to fill it in

**Mitigation:**
- Add Listing form makes street address a prominent required-ish field
- AI parse should always attempt to extract street address
