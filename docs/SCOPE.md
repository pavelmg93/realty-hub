# Session 29 — UI Polish Batch

**Date:** 2026-03-24

**For each task, run `get_issue REA-XX` via Linear MCP to read the full spec before coding.**

## Step Zero — Do this FIRST

* [x] **[REA-86] CLAUDE.md: fix end-of-session flow, remove session numbers, remove deploy instructions**

---

## Parallelization Guide

The remaining 8 issues fall into 4 independent clusters. Subagents can work in parallel across different clusters. Do NOT parallelize issues within the same cluster.

```
Cluster A (Card components):    REA-83, REA-84
Cluster B (Listing detail):     REA-80, REA-85
Cluster C (Edit/New form):      REA-82, REA-72
Cluster D (Messages + i18n):    REA-71, REA-15
```

---

## Session Scope (8 issues + step zero)

### Cluster A — Card components
* [x] **[REA-83] Card/view polish: duplicate flags, listing ID removal, status on view page, i18n flags**
* [x] **[REA-84] Message button: icon-only + agent info in embedded message section**

### Cluster B — Listing detail + header
* [x] **[REA-80] REOPENED: Listing detail Leaflet map overlaps FIDT header** *(grep before coding — failed once already)*
* [x] **[REA-85] Map mode header spacing + FIDT logo centering**

### Cluster C — Edit/New form
* [x] **[REA-82] Edit listing page missing left/right margins**
* [x] **[REA-72] Add/Edit form fixes: labels, sections, ward seeding, translations, margins**

### Cluster D — Messages + i18n
* [x] **[REA-71] Bug: embedded messages show "No messages yet" despite messages existing**
* [x] **[REA-15] Vietnamese UI translations: i18n pass (recurring)**

---

## Execution order

1. **REA-86 first** (CLAUDE.md cleanup — must land before any other work)
2. Clusters A + B + C in parallel (or sequential if single-agent)
3. REA-71 (messages bug)
4. REA-15 LAST (i18n sweep catches all new strings from above)

## NOT in scope

- REA-73: Status system rename (cross-cutting DB migration, deferred to S30)
- REA-75: Scroll position restoration (deferred)
- REA-13: Full-text search (feature, not polish)
- REA-63: DB sync script (infra, manual — Pavel will prioritize after S29)
