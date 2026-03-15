# AntiGravity Onboarding Brief
## ProMemo — Wealth Realty Agent Platform
*Demo Build Context · March 2026*

---

## 1. What This Project Is

ProMemo is a **private internal platform** for real estate agents working in the Nha Trang market.

**Agents can:**
- Share property listings
- Browse listings from other agents
- Message each other
- Track buyer and seller relationships
- Manage deals

The current stage is a **polished demo**, not a production system. The demo must feel:
- Fast
- Beautiful
- Consistent
- Reliable

---

## 2. Current Development Objective

The entire focus is **UI/UX quality and smoothness**, including:
- Page consistency
- Visual polish
- Responsiveness
- Interaction quality
- Speed of common actions

**Key flows that must feel finished:**
- Creating listings
- Browsing the feed
- Messaging another agent
- Editing listings
- Navigating between screens

> Backend expansion is **not** the priority right now.

---

## 3. What the Demo Actually Uses

The demo uses a **fixed dataset** and **manual listing creation**. There is no active ingestion pipeline.

**Demo data:**
- 72 listings total, split evenly between two users:
  - `pavel` → 36 listings
  - `dean` → 36 listings

Agents can also **create new listings directly inside the web app** — this is the primary listing creation path for the demo.

---

## 4. What Is Disabled

Several systems exist in the repo but are **intentionally disabled** as future infrastructure.

### Disabled Components

| Component | Notes |
|---|---|
| **Kestra orchestration** | Disabled in `docker-compose`. Do not enable. |
| **Zalo ingestion pipeline** | Remains in repo as future architecture. Not used. |
| **Web scraping pipelines** | Future components only. Not part of demo workflow. |

> **Rule:** If you encounter code related to Kestra, Zalo ingestion, scrapers, or ETL pipelines — assume it is intentionally inactive and **should not be modified** for demo work.

---

## 5. Active System Architecture

Only the web application matters for the demo:

```
Next.js Web App
      │
 PostgreSQL
      │
  Redis (support services)
```

Everything visible to users happens in the **Next.js application**.

---

## 6. Technology Stack

### Web Application
- **Framework:** Next.js 15, React 19, TypeScript, Tailwind v4
- **Design goals:** Simple architecture, minimal abstraction, predictable behavior

### Backend
- **Database:** PostgreSQL with raw `pg` connection pool — **no ORM**
- **Auth:** bcrypt password hashing, JWT, httpOnly cookies

### Maps
- **Library:** Leaflet + OpenStreetMap — already implemented

---

## 7. Running the System

Primary development environment uses Docker.

**Start services:**
```bash
docker compose up -d
```

**Expected containers:**
- `app-postgres`
- `web`
- `pgadmin`
- `redis`

**Ports:**
| Service | URL |
|---|---|
| Web app | http://localhost:8888 |
| pgAdmin | http://localhost:5050 |
| Postgres | `5432` |
| Redis | `6379` |

---

## 8. Core User Roles

| User | Role |
|---|---|
| `pavel` | agent |
| `dean` | agent |

Both accounts represent real estate agents collaborating on deals, with listings already loaded.

---

## 9. Primary User Workflow

These flows must be **perfectly smooth** for the demo walkthrough.

### 1. Login
- Fast login, no UI glitches, clear navigation

### 2. Browse Feed
- Feed grid, filters, sorting, map view
- The feed is the **central screen** of the application

### 3. Open Listing
- Property specs, description, map, listing agent info
- Layout consistency matters here

### 4. Message Another Agent
- Flow: `listing → conversation thread → messages`
- Messages poll every few seconds — must feel instant and reliable

### 5. Create Listing
Two modes:
- Freestyle text
- Structured fields

Freestyle text can be parsed into structured fields. Must feel smooth and intuitive.

### 6. Edit Listing
Editable fields:
- Property details
- Pricing
- Description
- Status

Must feel stable and predictable.

---

## 10. Database Model (Simplified)

### Agents (`agents`)
System users.
- `id`, `name`, `username`, `phone`, `email`

### Listings (`parsed_listings`)
Property records belonging to agents.
- `price`, `property_type`, `bedrooms`, `bathrooms`, `area`, `location`, `description`

### Conversations
Agent communication.
- Tables: `conversations`, `messages`
- Each listing has its own message thread

---

## 11. What Makes a Good Contribution

- **Visual Consistency** — Components behave the same across pages; buttons, forms, cards, and navigation feel uniform
- **Performance** — Pages feel fast; avoid unnecessary re-renders or slow database calls
- **UI Polish** — Spacing, hover states, loading states, empty states, animation smoothness
- **Code Simplicity** — Prefer clear and maintainable code; avoid over-engineering

---

## 12. What Not to Do

### Do not work on pipelines
- Do not modify Kestra, Zalo ingestion, scrapers, or ETL infrastructure
- These systems are intentionally inactive

### Do not introduce heavy architecture
- Avoid ORMs, complex service layers, or unnecessary abstractions
- The current stack is intentionally simple

### Do not change core demo flows
- Changes should improve polish, not redesign the experience

---

## 13. The Goal of This Phase

This phase is about creating something that feels like **a finished product**.

The experience should make observers think:
> *"Agents could use this tomorrow."*

**The best improvements are:**
- Visual refinement
- Layout improvements
- Performance gains
- Interaction smoothness

---

## 14. Mental Model

> **Think of the system as: Slack + Zillow + CRM — for real estate agents**

Agents share listings, talk to each other, and manage deals. Everything in the demo should reinforce that vision.
