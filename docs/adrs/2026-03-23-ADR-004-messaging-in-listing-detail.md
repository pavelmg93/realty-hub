# ADR 004: Messaging Integration into Listing Detail

**Date:** 2026-03-23  
**Status:** Accepted  
**Author:** Pavel + Claude  

---

## Context / Problem

Agents browse listings in the Feed and need to message listing owners. Currently this requires navigating away to a separate Messages page — a context switch that breaks the browsing flow. The listing detail page has no messaging surface.

---

## Decision

Add a **Messages section** at the bottom of the listing detail page (`/dashboard/listings/[id]/view`).

### Page layout (top to bottom):

```
┌─────────────────────────────────────────────┐
│  34/2 Nguyen Thien Thuat                    │
│  100 7 10 10 20ty hh1          (title,large)│
├─────────────────────────────────────────────┤
│  📷 Photo carousel                          │
├─────────────────────────────────────────────┤
│  Key specs • Description                    │
│  Property details • Map • Agent info        │
├─────────────────────────────────────────────┤
│  ─── Messages about this listing ───        │
│                                             │
│  CASE A: Viewer ≠ listing owner             │
│  ┌─────────────────────────────────┐        │
│  │ Single thread: you ↔ owner      │        │
│  │ [msg1] [msg2] ... [latest]      │        │
│  │ [type reply here...]    [Send]  │        │
│  │                                 │        │
│  │ OR if no thread yet:            │        │
│  │ "Ask about this listing"        │        │
│  │ [type message...]       [Send]  │        │
│  └─────────────────────────────────┘        │
│                                             │
│  CASE B: Viewer = listing owner             │
│  ┌─────────────────────────────────┐        │
│  │ ▼ Agent Minh (3 messages)       │        │
│  │   [msg] [msg] [msg]            │        │
│  │   [reply...]            [Send]  │        │
│  │                                 │        │
│  │ ▶ Agent Linh (1 message)        │        │
│  │   (collapsed)                   │        │
│  │                                 │        │
│  │ ▶ Agent Tuan (5 messages)       │        │
│  │   (collapsed)                   │        │
│  └─────────────────────────────────┘        │
│                                             │
└─────────────────────────────────────────────┘
```

### Feed button routing:

- **"View Messages"** → `router.push(/dashboard/listings/[id]/view#messages)` — auto-scrolls to messages section
- **"Message Agent"** → same route — scrolls to messages section, shows first-message input

### What does NOT change:

- `/dashboard/messages` — central inbox, untouched
- `/dashboard/messages/[conversationId]` — standalone thread page, still accessible from inbox

---

## Rationale

- Keeps agents in context: browse listing → see details → message — all on one page
- Owner gets a mini-inbox for their listing without navigating away
- Reuses existing `MessageThread` component — minimal new code
- No architectural changes to the messages data model or API

---

## Implementation Notes

- **Scroll-to-anchor:** `useEffect` + `document.getElementById('messages')?.scrollIntoView({ behavior: 'smooth' })` when URL hash = `#messages`
- **Case A (not owner):** Fetch `GET /api/conversations?listing_id=[id]&agent_id=[currentAgent]` — returns 0 or 1 thread
- **Case B (owner):** Fetch `GET /api/conversations?listing_id=[id]` — returns all threads for this listing. Render as collapsible accordion. Most recent thread expanded by default.
- **New conversation:** POST `/api/conversations` with `listing_id` + `other_agent_id`, then render thread inline
- **Loading:** Skeleton loader for messages section while conversations fetch

---

## Consequences

**Positive:**
- Zero context switches for the primary agent workflow (browse → inquire)
- Listing owners get consolidated view of all inquiries per property
- Reuses existing components — no new API endpoints needed (only new query params)

**Negative / Risks:**
- Listing detail page grows longer (photos + info + messages)
- Two surfaces to read the same thread (listing detail + messages page) — could confuse if state seems out of sync

**Mitigation:**
- Both surfaces read from the same API — no stale data risk
- Messages section loads lazily (below the fold) — doesn't slow initial page load
- Loading skeleton prevents scroll-to-anchor firing before content is ready
