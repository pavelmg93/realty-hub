# Session: Title Zombie Kill + Infra Fixes
**Date:** 2026-03-23

### Summary
Session 25b was a focused follow-up to S25, addressing residual "zombie" title_standardized values that survived the initial regenerate script, plus infrastructure hardening. The session also fixed the `create_agent.sh` default handling and cleaned up stale DB entries.

### Technical Details & Fixes
* **Features Delivered:**
  - Title zombie kill — improved `regenerate-titles.sh` SQL formula to catch edge cases where titles weren't being overwritten
  - Infra fixes — `create_agent.sh` parameter handling improved; stale agent seed references cleaned up
  - DB row count assertions added to `deploy-vm.sh update` — prints WARNING if any table count drops post-seed

* **Architecture/DB Changes:**
  - `regenerate-titles.sh` formula updated — more aggressive overwrite of malformed titles
  - `deploy-vm.sh` update mode: captures pre-seed counts for agents, parsed_listings, conversations, listing_photos

* **Challenges Resolved:**
  - Some `title_standardized` values had stale format from before migration 015/016; regenerate script now forces consistent formula on every deploy

### Files Touched
- `scripts/regenerate-titles.sh` (formula update)
- `scripts/deploy-vm.sh` (row count assertions)
- `scripts/create_agent.sh` (parameter defaults)
