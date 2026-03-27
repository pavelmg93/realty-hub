# Session 40 — Filters + Edit Form Fixes

**Date:** 2026-03-27

**For each task, run `get_issue REA-XX` via Linear MCP to read the full spec before coding.**

> **⚠️ NO SUBAGENTS. Execute all tasks SEQUENTIALLY.**

---

## Session Scope (1 issue, 6 sub-tasks)

* [x] **[REA-111] Filters + Edit form batch** — read the full issue spec, it contains 6 numbered sub-tasks:
  1. Mobile keyboard: `inputMode="decimal"` on price inputs
  2. Price filter: replace freestyle text with Billion VND (tỷ) stepper (0.01 precision, up/down buttons)
  3. Edit form: move Status to Classification, Legal Status to Extras — match New Listing field order
  4. Edit form: status dropdown must include all 7 statuses (just_listed, selling, price_dropped, price_increased, deposit, sold, not_for_sale)
  5. Auto-set price_increased/price_dropped on edit save when price changes (server-side, PUT route)
  6. Listing count "X listings" — stable height, no flicker during filter changes
