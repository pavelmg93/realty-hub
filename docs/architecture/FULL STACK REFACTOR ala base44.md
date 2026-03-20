# 🧠 REALTY HUB FRONTEND REFACTORING REPORT
**Target:** Next.js App Router codebase  
**Goal:** Reduce complexity, improve scalability, enforce clean architecture  
**Scope:** Listings + Messages (pattern applies globally)

---

# 0. 🧭 EXECUTIVE SUMMARY

Your codebase is **not broken**, but it has reached a **complexity tipping point**.

### Core Problem
You are organizing code by:
- location (`app/`, `components/`)

Instead of:
- **domain (listings, messages)**
- **responsibility (UI, logic, data)**

### Resulting Issues
- Pages are overloaded (too much logic)
- Components mix UI + business logic + API calls
- Folder duplication (`app/...` vs `components/...`)
- Hard to scale and reason about

---

# 1. 🏗️ TARGET ARCHITECTURE (HIGH LEVEL)

## 1.1 Architecture Style

Adopt:

> **Feature-First + Layered Architecture**

---

## 1.2 Final Folder Structure

```
/app
  /dashboard
    /listings/[id]/view/page.tsx
    /messages/[conversationId]/page.tsx

/features
  /listings
    /components
    /hooks
    /services
    /utils
    /types

  /messages
    /components
    /hooks
    /services

/components
  /ui   ← ONLY reusable, domain-agnostic UI

/lib
  constants.ts
  (shared low-level utilities only)
```

---

## 1.3 Layer Responsibilities

| Layer        | Responsibility                          |
|-------------|----------------------------------------|
| app/        | Routing + orchestration ONLY           |
| features/   | Domain logic (listings, messages)      |
| components/ | Generic UI (buttons, badges, etc.)     |
| hooks/      | State + side effects                   |
| services/   | API calls                             |
| utils/      | Pure functions                         |

---

# 2. 🧠 CORE PRINCIPLES (METHODOLOGY)

---

## 2.1 Single Responsibility Rule

Each file must do **ONE thing only**:

| Type        | Allowed Responsibility |
|------------|----------------------|
| Page       | Compose components + call hooks |
| Component  | Render UI only |
| Hook       | Handle state + side effects |
| Service    | API communication |
| Utils      | Pure transformations |

---

## 2.2 “Smart vs Dumb” Separation

| Type            | Contains |
|----------------|---------|
| Smart (Hook)   | logic, API, state |
| Dumb (UI)      | JSX only |

---

## 2.3 Domain Isolation

All listing-related code lives in:

```
/features/listings
```

NOT scattered across:
- `/components/listings`
- `/app/...`

---

## 2.4 No API Calls in Components ❗

Bad:
```
fetch(`/api/listings/${id}`)
```

Good:
```
import { getListing } from "@/features/listings/services/listings.api"
```

---

## 2.5 No Business Logic in UI ❗

Bad:
```
const line2Parts = []
```

Good:
```
const { line1, line2 } = formatListingHeadline(listing)
```

---

# 3. 🔧 PHASED REFACTOR PLAN

---

## PHASE 1 — Introduce Feature Structure

### Step 1.1 Create folders

```
/features/listings
/features/messages
```

---

### Step 1.2 Move files

| FROM | TO |
|-----|----|
| components/listings/* | features/listings/components |
| message components | features/messages/components |

---

## PHASE 2 — Extract Services (API Layer)

---

### BEFORE (in page/component)

```
fetch(`/api/listings/${id}`)
```

---

### AFTER

```
/features/listings/services/listings.api.ts

export async function getListing(id: string) {
  const res = await fetch(`/api/listings/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch listing");
  return res.json();
}
```

---

## PHASE 3 — Extract Hooks (Business Logic)

---

### BEFORE (inside page)

```
useEffect(() => {
  fetchData()
}, [])
```

---

### AFTER

```
/features/listings/hooks/useListing.ts

export function useListing(id: string) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListing(id).then(setListing).finally(() => setLoading(false));
  }, [id]);

  return { listing, loading };
}
```

---

## PHASE 4 — Break Down Pages

---

### BEFORE

`ListingViewPage` = 500+ lines

---

### AFTER

```
/app/dashboard/listings/[id]/view/page.tsx

export default function Page() {
  const { id } = useParams();
  const { listing, loading } = useListing(id);

  return <ListingView listing={listing} loading={loading} />;
}
```

---

### Then:

```
features/listings/components/
  ListingView.tsx
  ListingHeader.tsx
  ListingGallery.tsx
  ListingTabs.tsx
  ListingDetails.tsx
  ListingActions.tsx
```

---

## PHASE 5 — Refactor ListingCard

---

### BEFORE (Problems)

- API call inside component
- Business logic inside UI
- Navigation logic mixed

---

### AFTER

---

### Hook

```
useFavorite.ts

export function useFavorite(listingId: number, initial: boolean) {
  const [isFavorited, setIsFavorited] = useState(initial);

  const toggle = async () => {
    const res = await fetch(`/api/listings/${listingId}/favorite`, {
      method: "POST",
    });
    const data = await res.json();
    setIsFavorited(data.favorited);
  };

  return { isFavorited, toggle };
}
```

---

### Utils

```
formatListing.ts

export function formatListingHeadline(listing) {
  const line1 = listing.address_raw || "";

  const parts = [];
  if (listing.area_m2) parts.push(`${listing.area_m2}m²`);
  if (listing.price_vnd) parts.push(formatPriceShortest(listing.price_vnd));

  return {
    line1,
    line2: parts.join(" "),
  };
}
```

---

### Component (clean)

```
export default function ListingCard({ listing }) {
  const { isFavorited, toggle } = useFavorite(
    listing.id,
    listing.is_favorited
  );

  const { line1, line2 } = formatListingHeadline(listing);

  return (
    <div>
      <h2>{line1}</h2>
      <p>{line2}</p>

      <button onClick={toggle}>
        {isFavorited ? "♥" : "♡"}
      </button>
    </div>
  );
}
```

---

# 4. 🧱 MESSAGE SYSTEM CLEANUP

---

## Current Problem

`ConversationPage`:
- Fetching messages
- Polling
- UI rendering
- Actions

---

## Refactor

---

### Hook

```
useConversation.ts

export function useConversation(conversationId: string) {
  const [messages, setMessages] = useState([]);

  const fetchMessages = async () => {
    const res = await fetch(`/api/conversations/${conversationId}/messages`);
    const data = await res.json();
    setMessages(data.messages);
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  return { messages };
}
```

---

### Page becomes:

```
export default function Page() {
  const { conversationId } = useParams();
  const { messages } = useConversation(conversationId);

  return <ConversationView messages={messages} />;
}
```

---

# 5. 📉 COMPLEXITY REDUCTION OUTCOME

---

## BEFORE

- Pages: 400–600 lines
- Mixed concerns everywhere
- Hard to debug

---

## AFTER

- Pages: ~30–80 lines
- Components: ~50–150 lines
- Hooks: isolated logic
- Services: reusable API layer

---

# 6. 🚨 STRICT RULES (NON-NEGOTIABLE)

---

### ❌ NEVER
- Fetch inside UI components
- Format data inside JSX
- Put domain logic in `/components/ui`
- Let pages exceed ~150 lines

---

### ✅ ALWAYS
- Use hooks for logic
- Use services for API
- Use utils for formatting
- Group by feature

---

# 7. 🎯 MINIMAL MIGRATION STRATEGY

Do NOT rewrite everything.

### Order:

1. Create `/features`
2. Move listing code first
3. Extract hooks/services gradually
4. Refactor pages LAST

---

# 8. 🧠 FINAL MENTAL MODEL

---

When writing code:

Ask:

> “Is this about LISTINGS?”

→ goes in `/features/listings`

> “Is this logic?”

→ hook

> “Is this API?”

→ service

> “Is this formatting?”

→ util

> “Is this UI only?”

→ component

---

# 9. 🔚 FINAL NOTE

Your current system is:

> **Stage 2: Working but scaling pain**

This refactor moves you to:

> **Stage 3: Structured, scalable frontend system**

---

If you follow this strictly, your codebase will:
- Feel 50% simpler
- Be easier to extend
- Be safer to modify

---

END OF REPORT