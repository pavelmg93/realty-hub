# Realty Hub — Project Scope
**Sprint:** Post-Pilot UX Polish
**Phase:** Iterating based on pilot feedback
**Version:** v1.1-polish

---

## 🔴 Current Session: 24 — UI/UX Polish + Messaging Redesign

**Branch:** `main` (direct commits)
**Linear:** REA-41 through REA-50
**Goal:** Fix avatar display regression, standardized title adjustments, listing detail cleanup, map/mobile fixes, toolbar unification, embed messaging into listing detail.

### Tasks (execute top-down)

* [x] **[Bug: Avatar not displayed — REA-41]** Agent avatar uploads work but avatars don't render in feed cards, listing detail, or conversation threads. Update APIs to return `avatar_url`, update all UI components to render `<img>` with initials fallback.

* [x] **[Title: swap commission/price order — REA-42]** In `generateTitleStandardized()`, move commission after price. New format: `<area> <floors> <frontage> <depth> <price> <commission>`. Write migration to fix existing DB rows.

* [x] **[Title: scale larger in listing detail — REA-43]** Increase standardized title font size in listing detail view. Should be prominent across content width (`text-2xl sm:text-3xl` or larger). Note: title appears ABOVE the photo carousel in listing detail.

* [x] **[Listing detail: deduplicate info — REA-44]** Audit listing detail page for redundant sections (duplicate price/USD conversion block). Correct layout order: Standardized title (large) → Photo carousel → Specs → Description → Details → Map → Agent info → Messages. Remove all duplicate data.

* [x] **[Map: fix height + mobile scroll trap — REA-45]** Constrain map view height so bottom nav is always visible. Add non-map touch zone so mobile users can scroll past the map. Formula: `h-[calc(100vh-topbar-bottomnav)]`.

* [x] **[My Listings: remove filter chips — REA-46]** Remove standalone status filter buttons (Active/All/Archived chips). Move status filtering into the filter panel.

* [x] **[Unify toolbar: Feed + My Listings — REA-47]** Make search, filters, grid toggle, and map toggle identical between Feed and My Listings. Single row on all viewports. Remove 3-wide grid option — only 1-wide and 2-wide.

* [x] **[Conversation thread: sticky headers — REA-48]** Restructure `/dashboard/messages/[conversationId]`: agent header (sticky) → property bar (sticky) → messages viewport (scroll to latest) → input (fixed bottom). See ADR-004.

* [x] **[Listing detail: embed messages — REA-49]** Add message section at bottom of listing detail. Case A (not owner): single thread with listing owner, or "start conversation" input. Case B (owner): collapsible accordion of ALL inquiry threads. Feed "View Messages" and "Message Agent" buttons → `/dashboard/listings/[id]/view#messages` (auto-scroll). `/dashboard/messages` inbox remains unchanged. See ADR-004.

* [x] **[Mobile: disable zoom — REA-50]** Set viewport meta to `maximum-scale=1, user-scalable=no`. Fix any horizontal overflow.

---

## ⏭️ Queue (execute if time permits)

1. **Vietnamese UI translations — REA-15** (recurring) Full i18n pass on any new UI strings.

---

## ✅ Completed (Session 23)

* [x] **[Rename: ProMemo → Realty Hub — REA-38 + REA-35]** Full repo rename + FIDT branding.
* [x] **[Seed cleanup — REA-36]** Remove non-reference data from seed. Pre/post count checks.
* [x] **[Fix stale title_standardized — REA-39]** Migration 015 to strip m², T, x separator.
* [x] **[Price precision — REA-40]** Preserve agent-entered decimal places in price_short.

---

## 🧊 Backlog (not this sprint)

* [ ] Migrate photos to GCS — REA-18
* [ ] Notifications — REA-20
* [ ] API rate limiting — REA-21
* [ ] JWT expiry + refresh tokens
* [ ] Cloud Run / Cloud SQL migration
* [ ] CRM: person profile docs + deal events
* [ ] pgvector semantic search
* [ ] Public listing pages (`/l/[id]?token=xxx`)
* [ ] Upgrade Cloudflare SSL to "Full (Strict)" with origin cert
* [ ] Feed FTS (implemented but moved to Backlog) — REA-13
* [ ] Share card image generator — REA-14
* [ ] Gemini image/OCR parsing — REA-12
* [ ] Create pilot accounts — REA-8
