# Realty Hub — Project Scope
**Sprint:** Stabilization (continued)
**Version:** v1.3

---

## ⚠️ READ LINEAR ISSUES BEFORE CODING

For each task below, run `get_issue REA-XX` via Linear MCP to read the FULL spec + comments.
Comments contain post-deploy testing feedback with specific remaining bugs.

---

## 🔴 Current Session: 27b — Visual Regressions + Navigation + Map

**Branch:** `main`
**Max items:** 4 (deploy+test between sessions)

* [x] REA-78 — S27 visual regressions: duplicate status badge, tiny fonts, 4-line title, archive in listing detail, margins
* [x] REA-77 — Remove back buttons, persist view mode in localStorage, fix map mode toolbar
* [x] REA-70 — Map: width should match grid container (not full viewport), mobile height still broken (see comments)
* [x] REA-74 — Remove Archive button from ALL UI surfaces — repo-wide grep pass

---

## ⏭️ Session 28

* [ ] REA-71 — Bug: embedded messages "No messages yet" despite messages existing
* [ ] REA-72 — Form fixes: labels, sections, ward seeding, translations, margins, nha_rieng ghost
* [ ] REA-73 — Status: rename For Sale → Selling, flag colors, auto-revert just_listed
* [ ] REA-75 — Navigation state: grid mode persistence, scroll restoration

---

## 🧊 Backlog

* [ ] REA-8 — Create pilot accounts
* [ ] REA-12 — Gemini OCR
* [ ] REA-13 — Feed FTS
* [ ] REA-14 — Share card
* [ ] REA-18 — Photos to GCS
* [ ] REA-20 — Notifications
* [ ] REA-21 — API rate limiting
* [ ] REA-51 — VM cleanup
* [ ] REA-63 — DB sync script
* [ ] REA-76 — Session logging (done in S27 — verify)
