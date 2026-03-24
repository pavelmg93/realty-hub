# Session 30 — Messages Fix + Status System + Polish

**Date:** 2026-03-24

**For each task, run `get_issue REA-XX` via Linear MCP to read the full spec before coding.**

**Execution mode:** Launch subagents for Clusters A, B, C in parallel. Run Cluster D sequential after all complete.

---

## Parallelization Guide

```
Cluster A (Messages — P0):      REA-87, REA-90, REA-89  (listing detail + message components)
Cluster B (Status system):      REA-73                   (DB migration + constants + cards)
Cluster C (UX polish):          REA-88, REA-75           (global CSS + navigation layer)
Cluster D (Infra — sequential): REA-63                   (scripts only, no web code)
```

⚠️ Cluster A and B both touch listing detail view — run B AFTER A completes, or have B only touch constants/DB/cards (not the view page message section).

---

## Session Scope (10 issues)

### Cluster A — Messages (P0 — do first)
* [x] **[REA-87] P0: Embedded messages in listing detail don't load existing conversations** *(grep before coding)*
* [x] **[REA-90] Embedded messages: inconsistent agent info display across states**
* [x] **[REA-89] Messages: show full two-line title in conversation header and inquiries list**

### Cluster B — Status system
* [x] **[REA-73] Listing status: rename For Sale → Selling, flag colors, auto-revert just_listed, feed visibility** *(DB migration — test carefully)*

### Cluster C — UX polish
* [x] **[REA-88] UX: cursor pointer on all clickable elements (global audit)**
* [x] **[REA-75] Navigation: scroll position restoration on back**

### Cluster D — Infra
* [x] **[REA-63] scripts/sync-db.sh — production → local DB sync**

### Remaining quick wins (if time allows)
* [ ] **[REA-13] Feed: full-text search with Vietnamese diacritics support**
* [ ] **[REA-14] Listing export: share card image + copy text v1**
* [ ] **[REA-12] Gemini parse: image/screenshot OCR parsing**

---

## Execution order

1. **Cluster A first** (messages P0 — REA-87 → REA-90 → REA-89, sequential within cluster)
2. **Cluster B + C in parallel** after A completes (or alongside if subagents)
3. **Cluster D** anytime — zero code overlap
4. **Remaining quick wins** only if clusters A-D complete cleanly

## NOT in scope
- REA-8: Create pilot accounts (manual — needs names from FIDT)
- REA-18: GCS migration (deferred)
- REA-20: Notifications (deferred)
- REA-21: API rate limiting (deferred)
