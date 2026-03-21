# [cite_start]Realty Hub: Internal Agent Platform Demo Roadmap [cite: 1]
[cite_start]**From Working Prototype to Investor-Ready Demo (Version 2.0 · March 2026)** [cite: 1]
[cite_start]**FIDT · WEALTH REALTY** [cite: 1]

---

## [cite_start]1. What Changed From V1 [cite: 2]
[cite_start]This is a revised roadmap[cite: 3]. [cite_start]The original V1 assumed several systems were not yet built[cite: 3]. [cite_start]Based on the latest project state, the following are confirmed working and have been removed from scope: [cite: 4]

| Was Planned in V1 | Actual State | Impact on Roadmap |
| :--- | :--- | :--- |
| OpenStreetMap / Leaflet integration | [cite_start]✅ Already built [cite: 5] | [cite_start]Removed from Phase 1 [cite: 5] |
| Photo upload / management | [cite_start]✅ Already built [cite: 5] | [cite_start]Removed — extend only [cite: 5] |
| Messaging system | [cite_start]✅ Already built [cite: 5] | [cite_start]Redesign UI only [cite: 5] |
| Basic CRM (agents list) | [cite_start]✅ Already built [cite: 5] | [cite_start]Extend with Buyers/Sellers [cite: 5] |
| Map view (pins from feed) | [cite_start]✅ Already built [cite: 5] | [cite_start]Removed from Phase 1 [cite: 5] |
| Parsing pipeline (Kestra + Python) | [cite_start]⏸ Set aside for Demo [cite: 5] | [cite_start]Not in demo scope [cite: 5] |
| Web scraping pipeline | [cite_start]⏸ Set aside for Demo [cite: 5] | [cite_start]Not in demo scope [cite: 5] |
| Data seeding / CSV ingest | [cite_start]⏸ Set aside for Demo [cite: 5] | [cite_start]3 manual test users instead [cite: 5] |
| Push notifications | [cite_start]❌ Not built [cite: 5] | [cite_start]MVP scope only — not Demo [cite: 5] |
| Social media auto-posting | [cite_start]❌ Not built [cite: 5] | [cite_start]Scaffolded in Demo, real in MVP [cite: 5] |

## [cite_start]2. Demo Scope Definition [cite: 12]
[cite_start]The demo goal is a polished, investor-ready walkthrough with 3 real agent accounts, real listings created manually, and AI-assisted listing creation[cite: 6]. [cite_start]The demo is not an MVP[cite: 13]. [cite_start]It is a focused, scripted walkthrough for potential partners or investors[cite: 13]. 
* [cite_start]**Budget target:** ~$0/month during demo phase[cite: 7].
* [cite_start]Every feature must work reliably for 3 specific user accounts performing specific actions[cite: 14]. 
* [cite_start]Rough edges outside the demo path are acceptable[cite: 15].

### [cite_start]2.1 Current State — Confirmed Built [cite: 8]
* [cite_start]**Auth & Users:** ✅ Done [cite: 9]
* [cite_start]**Listing CRUD:** ✅ Done [cite: 9]
* [cite_start]**Feed + Filters:** ✅ Done [cite: 9]
* [cite_start]**Map View:** ✅ Done [cite: 9]
* [cite_start]**Messaging:** ✅ Done [cite: 10]
* [cite_start]**Basic CRM:** ✅ Partial [cite: 10]
* [cite_start]**Photo Mgmt:** ✅ Done [cite: 10]
* [cite_start]**OSM / Leaflet:** ✅ Done [cite: 10]
* [cite_start]**AI Listing Entry:** 🔨 Build [cite: 11]
* [cite_start]**CRM Full:** 🔨 Build [cite: 11]
* [cite_start]**Deals Funnel:** 🔨 Build [cite: 11]
* [cite_start]**UI Polish:** 🔨 Build [cite: 11]

### [cite_start]2.2 Three Demo Users [cite: 16]
[cite_start]All three accounts are seeded in `init_db.sql`[cite: 18]. Credentials documented in `USAGE.md`[cite: 18]. Passwords: `demo123` (change before any real-world showing)[cite: 18].

| Username | Role / Market | Demo Story |
| :--- | :--- | :--- |
| `dean` | [cite_start]Senior Broker · Nha Trang [cite: 17] | Lists a villa. [cite_start]Gets inquiries from other agents. [cite: 17] |
| `sarah` | [cite_start]Associate · HCMC [cite: 17] | [cite_start]Browses feed, messages Dean about his listing, adds her own apartment. [cite: 17] |
| `minh` | [cite_start]Junior Agent · Hanoi [cite: 17] | Uses AI listing entry to add a land plot. [cite_start]Manages a buyer lead. [cite: 17] |

### [cite_start]2.3 What the Demo Must Show [cite: 19]
| # | Demo Moment | Screen / Feature | Status |
| :--- | :--- | :--- | :--- |
| 1 | [cite_start]Login as Dean, see feed with listings and map [cite: 20] | [cite_start]Feed grid + map toggle [cite: 20] | [cite_start]✅ Done [cite: 20] |
| 2 | [cite_start]Open a listing, see full detail, property specs, agent card [cite: 20] | [cite_start]Full Listing View [cite: 20] | [cite_start]🔨 Polish [cite: 20] |
| 3 | [cite_start]Add new listing using voice/text AI entry [cite: 20] | [cite_start]Add Listing + AI [cite: 20] | [cite_start]🔨 Build [cite: 20] |
| 4 | [cite_start]AI prefills fields, flags duplicate, asks follow-up [cite: 20] | [cite_start]AI assistant flow [cite: 20] | [cite_start]🔨 Build [cite: 20] |
| 5 | [cite_start]Review and publish listing, see it appear in feed [cite: 20] | [cite_start]Publish flow [cite: 20] | [cite_start]✅ Mostly done [cite: 20] |
| 6 | [cite_start]Share private link to a client (copy to clipboard) [cite: 20] | [cite_start]Share action [cite: 20] | [cite_start]🔨 Build [cite: 20] |
| 7 | [cite_start]Switch to Sarah, browse feed, message Dean's listing [cite: 20] | [cite_start]Messaging [cite: 20] | [cite_start]✅ Done [cite: 20] |
| 8 | [cite_start]Switch to Minh, create buyer lead, associate to listing [cite: 20] | [cite_start]CRM — Buyers [cite: 20] | [cite_start]🔨 Build [cite: 20] |
| 9 | [cite_start]See deal pipeline: lead → negotiating [cite: 20] | [cite_start]Deals funnel [cite: 20] | [cite_start]🔨 Build [cite: 20] |
| 10 | [cite_start]Switch back to Dean, see inquiry arrived, reply [cite: 20] | [cite_start]Inquiries inbox [cite: 20] | [cite_start]✅ Polish [cite: 20] |

---

## [cite_start]PHASE 1: UI Polish & Design System [cite: 21]
[cite_start]**Weeks 1–2 · Make what exists look like the Stitch mockups** [cite: 21]

[cite_start]Everything built so far is functional but visually bare[cite: 22]. [cite_start]Phase 1 applies the FIDT design system without touching any API routes or business logic[cite: 22]. [cite_start]Think of it as a CSS/component pass on existing screens[cite: 23].

[cite_start]**1.1 Design Tokens (Day 1)** [cite: 24]
[cite_start]Create `web/src/lib/tokens.ts` — single source of truth[cite: 25]. [cite_start]Then update `tailwind.config.ts` to expose them as named classes[cite: 25].

| Token | Value | Used For |
| :--- | :--- | :--- |
| `--orange` | [cite_start]`#E87722` [cite: 26] | [cite_start]Primary actions, badges, active nav, highlights [cite: 26] |
| `--navy` | [cite_start]`#1A2332` [cite: 26] | [cite_start]Page background, table headers [cite: 26] |
| `--surface-1` | [cite_start]`#1E2A3B` [cite: 26] | [cite_start]Card background [cite: 26] |
| `--surface-2` | [cite_start]`#243044` [cite: 26] | [cite_start]Input background, hover states [cite: 26] |
| `--surface-3` | [cite_start]`#2C3A50` [cite: 26] | [cite_start]Borders, dividers [cite: 26] |
| `--text-primary` | [cite_start]`#F8FAFC` [cite: 26] | [cite_start]Headings, labels [cite: 26] |
| `--text-secondary` | [cite_start]`#94A3B8` [cite: 26] | [cite_start]Subtext, placeholders [cite: 26] |
| `--status-open` | [cite_start]`#16A34A` [cite: 26] | [cite_start]OPEN badge [cite: 26] |
| `--status-negotiating` | [cite_start]`#E87722` [cite: 26] | [cite_start]NEGOTIATING badge [cite: 26] |
| `--status-pending` | [cite_start]`#CA8A04` [cite: 26] | [cite_start]PENDING badge [cite: 26] |
| `--status-sold` | [cite_start]`#DC2626` [cite: 26] | [cite_start]SOLD badge [cite: 26] |
| `--status-nfs` | [cite_start]`#64748B` [cite: 26] | [cite_start]NOT FOR SALE badge [cite: 26] |

[cite_start]**1.2 Global Layout** [cite: 27]
* **Bottom navigation:** Feed | My Listings | Inquiries | CRM | [cite_start]My Profile — uniform across all screens[cite: 28].
* [cite_start]**Active tab:** orange icon + label[cite: 29]. [cite_start]Inactive: gray icon only[cite: 29].
* [cite_start]**Unread badge:** on Inquiries tab: red dot with count[cite: 30].
* [cite_start]**Top bar pattern:** logo center, contextual icons right (search, filter, share, back arrow)[cite: 31].
* [cite_start]**Theme:** Dark mode forced permanently — remove any `prefers-color-scheme` media query, set `color-scheme: light` on html (paradoxically ensures consistent dark theme rendering)[cite: 32]. All components are dark-theme only. [cite_start]No light variants needed for demo[cite: 36].
* [cite_start]**Typography:** Inter font via `next/font` — apply to body globally[cite: 33].

[cite_start]**1.3 Component Library (build once, use everywhere)** [cite: 34]

| Component | Props / Variants | Replaces |
| :--- | :--- | :--- |
| `<StatusBadge>` | [cite_start]`status: open\|negotiating\|pending\|sold\|nfs`, `size: sm\|md` [cite: 35] | [cite_start]Inline status spans [cite: 35] |
| `<ListingCard>` | [cite_start]`listing`, `viewMode: 1x\|2x\|3x`, `showAgent`, `onMessage` [cite: 35] | [cite_start]Feed/My Listings cards [cite: 35] |
| `<AgentChip>` | [cite_start]`agent`, `size: sm\|md`, `clickable`, `showOnline` [cite: 35] | [cite_start]Agent info in cards [cite: 35] |
| `<PropertyDetailGrid>`| [cite_start]`specs: {icon, label, value}[]` [cite: 35] | [cite_start]Property specs section [cite: 35] |
| `<MessageRow>` | [cite_start]`thread`, `unread`, `propertyTag` [cite: 35] | [cite_start]Inquiries list rows [cite: 35] |
| `<ChatBubble>` | [cite_start]`message`, `sent: bool` [cite: 35] | [cite_start]Chat screen bubbles [cite: 35] |
| `<FilterChip>` | [cite_start]`label`, `onDismiss`, `color` [cite: 35] | [cite_start]Active filter tags [cite: 35] |
| `<SearchBar>` | [cite_start]`placeholder`, `value`, `onChange` [cite: 35] | [cite_start]All search inputs [cite: 35] |
| `<ToggleSwitch>` | [cite_start]`checked`, `onChange`, `label` [cite: 35] | [cite_start]Profile visibility toggles [cite: 35] |
| `<PhotoGrid>` | [cite_start]`photos`, `onAdd`, `onReorder`, `onSetCover` [cite: 35] | [cite_start]Listing media section [cite: 35] |
| `<BottomSheet>` | [cite_start]`open`, `onClose`, `children` [cite: 35] | [cite_start]Mobile action sheets [cite: 35] |
| `<PriceDisplay>` | [cite_start]`vnd: number`, `showUSD: bool` [cite: 35] | [cite_start]Price everywhere [cite: 35] |
| `<GridToggle>` | [cite_start]`value: 1\|2\|3`, `onChange` [cite: 35] | [cite_start]My Listings + Feed [cite: 35] |
| `<MapPinLabel>` | [cite_start]`price`, `status`, `selected` [cite: 35] | [cite_start]OSM map pins [cite: 35] |
| `<PersonCard>` | [cite_start]`person`, `type: buyer\|seller\|agent`, `onClick` [cite: 35] | [cite_start]CRM lists [cite: 35] |
| `<FunnelColumn>` | [cite_start]`stage`, `deals: Deal[]` [cite: 35] | [cite_start]Deals view [cite: 35] |

[cite_start]**1.4 Screen-by-Screen Polish Pass** [cite: 37]

| Screen | Changes Needed | Effort |
| :--- | :--- | :--- |
| Feed — Grid | Apply `ListingCard`, `GridToggle`, `SearchBar`, `FilterChip`. [cite_start]Keep all API calls unchanged. [cite: 38] | [cite_start]M [cite: 38] |
| Feed — Map | [cite_start]Style OSM map controls, apply `MapPinLabel`, bottom sheet for selected listing. [cite: 38] | [cite_start]S [cite: 38] |
| My Listings | Apply `ListingCard` with owner highlight (orange left border). [cite_start]Status filter tabs. [cite: 38] | [cite_start]M [cite: 38] |
| Full Listing View | [cite_start]Hero carousel, `PropertyDetailGrid`, `AgentChip`, `PriceDisplay`, sticky Message bar. [cite: 38] | [cite_start]M [cite: 38] |
| Add/Edit Listing | [cite_start]Section grouping, `PhotoGrid`, icon-grid for property type, map pin picker. [cite: 38] | [cite_start]L [cite: 38] |
| Inquiries Inbox | [cite_start]Apply `MessageRow`, property/agent filter toggles, Priority Deals section. [cite: 38] | [cite_start]M [cite: 38] |
| Chat Screen | [cite_start]`ChatBubble`, property context bar, quick-action chips, styled input bar. [cite: 38] | [cite_start]S [cite: 38] |
| My Profile | [cite_start]`ToggleSwitch` for each contact field, Edit/Preview toggle. [cite: 38] | [cite_start]S [cite: 38] |

---

## [cite_start]PHASE 2: AI-Assisted Listing Entry [cite: 39]
[cite_start]**Weeks 2–3 · The centerpiece demo feature** [cite: 39]

[cite_start]This is the single most impressive demo feature[cite: 40]. An agent speaks or types a Vietnamese listing description; [cite_start]AI transcribes, extracts structured fields, checks for duplicates, geo-tags from photos if possible, and asks follow-up questions — all within the Add Listing form[cite: 40, 41].

[cite_start]**2.1 AI Provider Strategy — Near-$0 Budget** [cite: 42]
[cite_start]Gemini 1.5 Flash free tier (Google AI Studio key, not Vertex): 15 requests/min, 1M tokens/day[cite: 44]. [cite_start]More than sufficient for a 3-user demo[cite: 45]. [cite_start]Key stored in `.env` as `GEMINI_API_KEY`[cite: 45].

| Task | Provider | Free Tier | Fallback |
| :--- | :--- | :--- | :--- |
| Speech-to-text (voice) | [cite_start]Gemini 1.5 Flash (audio) [cite: 43] | [cite_start]15 RPM / 1M TPM free via API [cite: 43] | [cite_start]Browser Web Speech API (offline, zero cost) [cite: 43] |
| Field extraction from text | [cite_start]Gemini 1.5 Flash [cite: 43] | [cite_start]Same free tier [cite: 43] | [cite_start]Gemini 2.0 Flash if needed [cite: 43] |
| Duplicate detection | [cite_start]Gemini + vector similarity [cite: 43] | [cite_start]Embedding: free via Gemini [cite: 43] | [cite_start]Simple text similarity in Postgres [cite: 43] |
| Geo-tag from photo EXIF | [cite_start]Sharp.js (local, no API) [cite: 43] | [cite_start]Free, runs in Next.js server [cite: 43] | [cite_start]No fallback needed [cite: 43] |
| Description draft gen | [cite_start]Gemini 1.5 Flash [cite: 43] | [cite_start]Same free tier [cite: 43] | [cite_start]— [cite: 43] |
| Follow-up question gen | [cite_start]Gemini 1.5 Flash [cite: 43] | [cite_start]Same free tier [cite: 43] | [cite_start]Hardcoded question templates [cite: 43] |

[cite_start]**2.2 User Flow — Step by Step** [cite: 46]
1. Tap '+' in My Listings → Add Listing opens. [cite_start]Empty form with Freeflow tab active by default. [cite: 47]
2. Tap microphone icon OR type in freeflow textarea. If mic: Web Speech API starts recording (browser native, free). [cite_start]Transcript streams into textarea. [cite: 47]
3. Tap 'Parse with AI' button (or auto-triggers after 2s pause). Loading state: 'Analyzing...' spinner. [cite_start]POST to `/api/ai/parse-listing`. [cite: 47]
4. AI extracts fields. Fields in Database tab auto-fill. [cite_start]Confidence shown per field (green > 80%, yellow 50-80%, red < 50%). [cite: 47]
5. AI checks EXIF of any uploaded photos. If GPS data found: geo-pin auto-placed on map. [cite_start]Toast: 'Location found in photo metadata'. [cite: 47]
6. AI checks for duplicates. Compares address + price + area against user's listings and full feed. [cite_start]If match found: yellow warning banner with link to possible duplicate. [cite: 47]
7. AI generates description draft. Description field pre-filled with professional Vietnamese listing text. [cite_start]User can edit freely. [cite: 47]
8. AI asks follow-up questions. Chat-style Q&A panel appears below form. Example: 'Sổ đỏ hay sổ hồng?', 'Có thang máy không?', 'Diện tích đất bao nhiêu m²?'. [cite_start]Each answer updates the corresponding field. [cite: 47]
9. User reviews all fields, adjusts geo-pin on map. Map pin is draggable. Coordinates update in real-time. [cite_start]Address auto-reverse-geocoded on pin drop via Nominatim. [cite: 47]
10. User taps Publish. Listing saved, status = OPEN. Toast confirmation. [cite_start]Redirect to Full Listing View. [cite: 47]

[cite_start]**2.3 API Route — `/api/ai/parse-listing`** [cite: 48]
[cite_start]Single endpoint handles all AI tasks in one Gemini call to minimize latency and API usage[cite: 49].
* [cite_start]**Input:** `{ text: string, photos?: base64[], existingListings: Listing[] }` [cite: 50]
* [cite_start]**Prompt Logic:** instructs to extract fields → check duplicates → draft description → generate follow-up questions → return JSON[cite: 51]. [cite_start]Use `gemini-1.5-flash-latest` model[cite: 59].
* [cite_start]**Response schema:** Strict JSON mode via Gemini `response_mime_type: application/json` [cite: 52] [cite_start]guarantees parseable output — no regex stripping needed[cite: 59].
  * [cite_start]`fields: { price, area, ward, district, street, property_type, transaction_type, legal_status, floors, bedrooms, bathrooms, furnished, direction, ... }` [cite: 53]
  * [cite_start]`confidence: { [fieldName]: 0.0–1.0 }` [cite: 54]
  * [cite_start]`duplicate_warning: { found: bool, listing_id?: string, similarity: number }` [cite: 55]
  * [cite_start]`description_draft: string (Vietnamese)` [cite: 56]
  * [cite_start]`follow_up_questions: { field: string, question_vi: string, question_en: string }[]` [cite: 57]
  * [cite_start]`geo_from_exif: { lat: number, lng: number } | null` [cite: 58]

[cite_start]**2.4 Voice Input Implementation** [cite: 60]
* **Primary:** Browser Web Speech API — zero cost, works in Chrome/Edge on Android and desktop. [cite_start]`navigator.mediaDevices` + `window.SpeechRecognition`[cite: 61]. [cite_start]Set `lang='vi-VN'` for Vietnamese recognition — Chrome supports it well[cite: 62].
* [cite_start]**Fallback for Safari/Firefox:** record audio → send as base64 to `/api/ai/transcribe` → Gemini audio understanding (multimodal)[cite: 63].
* **UI:** animated waveform during recording (CSS only, no library). Tap to stop. [cite_start]Transcript appears immediately. [cite: 64]

[cite_start]**2.5 Photo EXIF Geo-Tagging** [cite: 65]
* [cite_start]Use `sharp` npm package (already likely in project) OR `exif-reader` (2KB, zero dependencies)[cite: 66].
* [cite_start]On photo upload: extract GPS tags server-side in the API route — no external API call needed[cite: 67].
* [cite_start]If GPS found: auto-place pin on Leaflet map, reverse geocode via Nominatim to fill address fields[cite: 68]. [cite_start]If no GPS: silently skip — most Vietnamese property photos won't have it but demo photos can be prepared with GPS data[cite: 69].

[cite_start]**2.6 Post-Publish Actions (Full Listing View)** [cite: 70]
[cite_start]After a listing is published, the Full Listing View gains an action bar at the top with these buttons[cite: 71]:

| Button | Demo Behavior | MVP Behavior |
| :--- | :--- | :--- |
| Share Private Link | [cite_start]Copies URL to clipboard: `realtyhub.fidt.vn/l/[id]?token=xxx`  Toast: 'Link copied' [cite: 72] | [cite_start]Send via Zalo / Gmail integration [cite: 72] |
| Create Post | Opens modal: AI drafts social post (Zalo / TikTok / LinkedIn / Facebook / BDS.vn tabs). [cite_start]User sees draft, taps 'Copy' only. [cite: 72] | [cite_start]Real posting via MCP / platform APIs [cite: 72] |
| Edit | [cite_start]Toggles listing form into edit mode inline [cite: 72] | [cite_start]Same [cite: 72] |
| Archive | [cite_start]Confirmation bottom sheet → archives listing → redirects to My Listings [cite: 72] | [cite_start]Same [cite: 72] |

[cite_start]*Note on Posts:* 'Create Post' modal is fully scaffolded with real AI-drafted content[cite: 73]. [cite_start]Only the 'Post' button is disabled in demo (shows tooltip: 'Social posting available in MVP')[cite: 74]. [cite_start]This still makes a strong impression[cite: 75].

---

## [cite_start]PHASE 3: CRM — Full Buyers, Sellers & Deals [cite: 76]
[cite_start]**Weeks 3–4 · Extend existing basic CRM** [cite: 76]

[cite_start]The existing CRM shows agent lists with favorites and message history[cite: 77]. [cite_start]Phase 3 adds Sellers, Buyers, and a Deals pipeline — the three additions that transform the app from a listing board into a full agent workbench[cite: 78].

[cite_start]**3.1 Data Model Additions (migration 006)** [cite: 79]
| Table | Key Columns | Notes |
| :--- | :--- | :--- |
| `persons` | [cite_start]`id, type (buyer\|seller\|agent_ref), full_name, phone, zalo, email, notes, status, created_by_agent_id, created_at` [cite: 80] | [cite_start]Unified people table — agents stay in agents table, this is for clients [cite: 80] |
| `person_listings` | [cite_start]`person_id, listing_id, role (buyer_interest\|seller\|co_agent), rating (1-5), notes` [cite: 80] | [cite_start]Many-to-many: person ↔ listings [cite: 80] |
| `person_documents` | [cite_start]`id, person_id, file_path, doc_type, uploaded_at` [cite: 80] | [cite_start]Ownership papers, IDs, agreements [cite: 80] |
| `deals` | [cite_start]`id, listing_id, buyer_person_id, seller_person_id, agent_id, stage, stage_updated_at, notes, closed_at, value_vnd` [cite: 80] | [cite_start]One row per deal attempt [cite: 80] |
| `deal_events` | [cite_start]`id, deal_id, event_type, notes, created_by, created_at` [cite: 80] | [cite_start]Immutable event log — interaction history [cite: 80] |
| `person_interactions` | [cite_start]`id, person_id, agent_id, interaction_type, notes, occurred_at` [cite: 80] | [cite_start]Log of calls, viewings, messages, meetings [cite: 80] |

[cite_start]**3.2 CRM Tab — Three Sub-Sections** [cite: 81]
The CRM tab becomes a tabbed view: Agents | Sellers | [cite_start]Buyers[cite: 82]. [cite_start]The existing agents list moves to become the Agents tab[cite: 83].
* [cite_start]**Agents Tab (existing, polish only):** [cite: 84] [cite_start]Keep existing list[cite: 85]. [cite_start]Add city filter chips, listing count badge, online dot (`last_active_at`)[cite: 85]. [cite_start]Tap row → read-only Agent Profile view (avatar, stats, listings, contact buttons)[cite: 86]. [cite_start]Favorite toggle (star) persists in DB per `agent_id`[cite: 87].
* [cite_start]**Sellers Tab (new):** [cite: 88] [cite_start]List of seller persons created by this agent[cite: 89]. [cite_start]Each row: name, phone, status badge, number of associated listings, last interaction date[cite: 90]. [cite_start]Tap '+ Add Seller': form with name, phone, Zalo, email, notes, status, associate to listing(s)[cite: 91]. [cite_start]Full Seller view: contact info, associated listings (each clickable → Full Listing), document uploads, interaction history log[cite: 92]. [cite_start]Status progression: Lead → Qualified → Active Listing → Negotiating → Closed Won → Closed Lost[cite: 93]. [cite_start]Interaction history: chronological list of `deal_events` — tap '+' to log a call, meeting, or note[cite: 94].
* [cite_start]**Buyers Tab (new):** [cite: 95] [cite_start]List of buyer persons created by this agent[cite: 96]. [cite_start]Each row: name, phone, status badge, number of matched listings, rating average, last interaction[cite: 97]. [cite_start]Tap '+ Add Buyer': form with name, phone, Zalo, email, buying criteria as structured fields [cite: 98][cite_start]: Budget range (VND min–max), Property type(s), Preferred wards/districts, Area range (m²), Must-haves (elevator, parking, direction, legal status)[cite: 99]. [cite_start]Full Buyer view: criteria display, associated/rated listings, document uploads, interaction history[cite: 100]. [cite_start]Ratings on listings: 1–5 stars per listing, visible only to the agent who rated[cite: 101]. [cite_start]Status progression: same funnel as Sellers but from buyer perspective[cite: 102].

[cite_start]**3.3 Deals View (new tab in bottom nav — or modal from CRM)** [cite: 103]
A Kanban-style pipeline. [cite_start]For the demo, implement as a horizontally scrollable column view[cite: 104]. [cite_start]Pre-populate with 2–3 deals in different stages using seed script for demo[cite: 111].
* [cite_start]**Stages & Colors:** [cite: 105] Cold Lead (`#64748B`), Engaged (`#2563EB`), Considering (`#7C3AED`), Viewing / Showing (`#CA8A04`), Offer / Negotiating (`#E87722`), Closing (`#16A34A`), Closed — Won (`#15803D`), Closed — Lost (`#DC2626`).
* [cite_start]**Card Details:** property thumbnail, person name + type (buyer/seller), price, days in stage[cite: 106].
* [cite_start]**Mechanics:** Drag-and-drop to move between stages (`react-beautiful-dnd` or `@hello-pangea/dnd` — MIT license, free)[cite: 107]. [cite_start]Stage move triggers `deal_events` insert automatically[cite: 110]. [cite_start]Tap card → Deal Detail: timeline of all `deal_events`, quick actions (log call, schedule viewing, add note)[cite: 108].
* **View Toggles:** Toggle at top: Person View (grouped by buyer/seller name) | [cite_start]Property View (grouped by listing)[cite: 109].

---

## [cite_start]PHASE 4: Listings Views — Consolidation & Polish [cite: 112]
[cite_start]**Week 4 · My Listings + Feed unified experience** [cite: 112]

[cite_start]**4.1 Consolidated Listings View** [cite: 113]
[cite_start]My Listings and Feed should eventually merge into one 'Listings' view with an ownership filter[cite: 114]. [cite_start]In the demo, keep them as separate nav items but share the same component/filter infrastructure[cite: 115].

| Feature | My Listings | Feed (All Listings) |
| :--- | :--- | :--- |
| Grid toggle (1x/2x/3x) | [cite_start]✅ Both [cite: 116] | [cite_start]✅ Both [cite: 116] |
| Map view toggle | [cite_start]✅ Both [cite: 116] | [cite_start]✅ Both [cite: 116] |
| Search bar | [cite_start]✅ Both [cite: 116] | [cite_start]✅ Both [cite: 116] |
| Filter: status/property type/price/ward/district | [cite_start]✅ Yes [cite: 116] | [cite_start]✅ Yes [cite: 116] |
| Filter: agent | [cite_start]❌ N/A (own listings) [cite: 116] | [cite_start]✅ Yes (new) [cite: 116] |
| Owner highlight | [cite_start]Orange left border on cards [cite: 116] | [cite_start]N/A [cite: 116] |
| Contact button | [cite_start]Opens inquiries for own listing [cite: 116] | [cite_start]Message Agent button [cite: 116] |
| Sort | [cite_start]Newest / Updated / Price / Area [cite: 116] | [cite_start]Same + by Agent [cite: 116] |

[cite_start]**4.2 Inquiries / Messages / Inbox — Naming Decision** [cite: 117]
Recommendation: call it 'Inquiries' in the nav (matches mockups). [cite_start]Inside the screen, use 'Messages' as the heading[cite: 118]. [cite_start]This is consistent with the Stitch designs[cite: 119].
* [cite_start]**Main view:** flat list of all message threads, newest first[cite: 120].
* **Toggle 'By Property':** groups threads by listing. [cite_start]Each listing is a collapsible group showing threads with different agents[cite: 121].
* **Toggle 'By Agent':** groups threads by the other agent. [cite_start]Each agent shows all properties you've discussed[cite: 122].
* [cite_start]**Navigation:** Tap any listing thumbnail within grouped view → Full Listing View[cite: 123]. [cite_start]Tap any agent avatar/name → Agent Profile (read-only CRM view)[cite: 124].
* [cite_start]**Architecture:** Thread primary key: `listing_id + agent_pair` (already implemented per TESTING_LOG Session 6)[cite: 125]. [cite_start]Listing agent's view: sees all inbound threads per listing when opening that listing's 'View Messages'[cite: 126].

---

## [cite_start]PHASE 5: Demo Deployment — Near-$0 Stack [cite: 127]
[cite_start]**Week 5 · Live URL, 3 users, investor-ready** [cite: 127]

[cite_start]**5.1 Infrastructure — $0 Demo Stack** [cite: 128]
[cite_start]Total Demo Infrastructure Cost: $0/month[cite: 130]. [cite_start]Railway free tier resets monthly[cite: 131]. [cite_start]If demo goes beyond 500 hrs, upgrade to Hobby ($5/mo) or move to Fly.io (similar free tier)[cite: 131].

| Service | Provider | Cost | Notes |
| :--- | :--- | :--- | :--- |
| Compute / hosting | [cite_start]Railway.app free tier [cite: 129] | [cite_start]$0 [cite: 129] | 500 hrs/mo free. Enough for demo. [cite_start]1 GB RAM, sufficient for Next.js + Postgres. [cite: 129] |
| PostgreSQL | [cite_start]Railway Postgres plugin [cite: 129] | [cite_start]$0 [cite: 129] | 100 MB free. [cite_start]Demo with 3 users and ~50 listings fits easily. [cite: 129] |
| File storage (photos/docs) | [cite_start]Cloudflare R2 [cite: 129] | [cite_start]$0 [cite: 129] | 10 GB free storage, 1M free requests/mo. [cite_start]Zero egress fees. [cite: 129] |
| CDN + SSL + DNS | [cite_start]Cloudflare free tier [cite: 129] | [cite_start]$0 [cite: 129] | [cite_start]Proxies Railway URL, adds SSL, custom subdomain: `realtyhub.fidt.vn` [cite: 129] |
| AI (Gemini) | [cite_start]Google AI Studio API key [cite: 129] | [cite_start]$0 [cite: 129] | 1.5 Flash free tier: 15 RPM, 1M TPD. [cite_start]3 demo users = no problem. [cite: 129] |
| Maps (Leaflet + OSM) | [cite_start]Already integrated [cite: 129] | [cite_start]$0 [cite: 129] | [cite_start]OpenStreetMap tiles: free for low traffic [cite: 129] |
| Geocoding (Nominatim) | [cite_start]Already integrated [cite: 129] | [cite_start]$0 [cite: 129] | 1 req/sec limit. [cite_start]Fine for demo. [cite: 129] |
| Speech-to-text | [cite_start]Web Speech API (browser) [cite: 129] | [cite_start]$0 [cite: 129] | [cite_start]Native Chrome API, no server needed [cite: 129] |
| Domain | [cite_start]`realtyhub.fidt.vn` [cite: 129] | [cite_start]$0 [cite: 129] | [cite_start]Subdomain of existing fidt.vn domain [cite: 129] |
| Monitoring | [cite_start]Railway built-in logs [cite: 129] | [cite_start]$0 [cite: 129] | [cite_start]Sufficient for demo phase [cite: 129] |

[cite_start]**5.2 Deployment — Railway Setup** [cite: 132]
* [cite_start]Connect GitHub repo `fidt-vn-re` to Railway project[cite: 133].
* [cite_start]Add Postgres plugin — Railway auto-sets `DATABASE_URL` env var[cite: 134].
* [cite_start]Set env vars in Railway dashboard: `JWT_SECRET`, `GEMINI_API_KEY`, `CLOUDFLARE_R2_*` (bucket, account id, key id, secret)[cite: 135].
* [cite_start]Dockerfile already exists — Railway detects and builds automatically[cite: 136].
* [cite_start]Custom domain: add `realtyhub.fidt.vn` in Railway → point CNAME to Railway URL in Cloudflare DNS[cite: 137].
* [cite_start]Run database migrations on first deploy: add `railway run npm run db:migrate` to release command[cite: 138].
* [cite_start]Seed 3 demo users: `railway run npm run db:seed:demo`[cite: 139].

[cite_start]**5.3 Cloudflare R2 — Photo Storage Setup** [cite: 140]
[cite_start]R2 replaces local filesystem for photos[cite: 141]. [cite_start]Near-zero config change since it's S3-compatible[cite: 141]:
* [cite_start]Create R2 bucket: `realtyhub-media` in Cloudflare dashboard[cite: 142].
* [cite_start]Install `@aws-sdk/client-s3` (R2 is S3-compatible) — use presigned URLs for uploads[cite: 143].
* [cite_start]Update photo upload API route: instead of writing to `/uploads/`, PUT to R2 via presigned URL[cite: 144].
* [cite_start]Update photo display: serve from R2 public URL (or Cloudflare CDN-cached URL)[cite: 145].
* [cite_start]R2 public access: enable for media bucket — all listing photos are already non-sensitive[cite: 146].

[cite_start]**5.4 Production Build Performance** [cite: 147]
[cite_start]The slow dev server noted in TESTING_LOG is resolved by production build[cite: 148]. [cite_start]Railway runs `next build` automatically[cite: 148].
* [cite_start]Add `next.config.js` optimizations: `images.domains` for R2 bucket URL, `output: 'standalone'` for smaller Docker image[cite: 149].
* [cite_start]Enable Next.js ISR (Incremental Static Regeneration) for the feed page: revalidate every 60 seconds[cite: 150].
* [cite_start]Add database connection pool: use `@vercel/postgres` or `pg-pool` with `max: 5` connections (Railway Postgres limit on free tier)[cite: 151].
* [cite_start]Compress API responses: Next.js does this by default in production[cite: 152].

[cite_start]**5.5 Demo Launch Checklist** [cite: 153]
* [cite_start][ ] Railway project created, repo connected, first deploy succeeds [cite: 154]
* [cite_start][ ] `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY` set in Railway env [cite: 154]
* [cite_start][ ] R2 bucket created, `CLOUDFLARE_R2_*` vars set [cite: 154]
* [cite_start][ ] Migrations run, 3 demo users seeded with `demo123` passwords [cite: 154]
* [cite_start][ ] `realtyhub.fidt.vn` DNS configured in Cloudflare, SSL active [cite: 154]
* [cite_start][ ] Demo listings created manually by each of the 3 users (5+ listings total) [cite: 154]
* [cite_start][ ] Demo deals seeded in pipeline (3 deals in different stages) [cite: 154]
* [cite_start][ ] End-to-end demo walkthrough tested on mobile Chrome (Android) [cite: 154]
* [cite_start][ ] Voice input tested with Vietnamese speech (Nha Trang listing text) [cite: 154]
* [cite_start][ ] AI field extraction tested: paste sample listing → verify fields fill correctly [cite: 154]
* [cite_start][ ] Duplicate detection tested: create near-duplicate → verify warning appears [cite: 154]
* [cite_start][ ] Share private link tested: URL opens correct listing without login [cite: 154]
* [cite_start][ ] Demo script written (10 min walkthrough, specific click path) [cite: 154]
* [cite_start][ ] Screen recording prepared as backup (in case of connectivity issues) [cite: 154]

---

## [cite_start]Deferred to MVP — Not in Demo [cite: 155]
[cite_start]These features are explicitly out of scope for the demo[cite: 156]. [cite_start]They are documented here so they're not forgotten and can be planned once the demo is validated[cite: 157].

| Feature | Why Deferred | MVP Estimate |
| :--- | :--- | :--- |
| Push notifications (new message, deal update) | Requires service worker + FCM or web push. Non-trivial. [cite_start]Not visible in a scripted demo. [cite: 158] | [cite_start]1 week [cite: 158] |
| Auto-posting to Zalo / TikTok / FB / LinkedIn | Requires platform API approval and MCP integration. [cite_start]Scaffolded in Demo (draft shown, no posting). [cite: 158] | [cite_start]2–3 weeks [cite: 158] |
| Vietnamese NLP parser (Kestra pipeline) | Works well but not needed when demo uses manual entry + AI. [cite_start]Re-enable for bulk import post-demo. [cite: 158] | [cite_start]Already built [cite: 158] |
| Web scraping (additional sites) | Listing volume not needed for demo. [cite_start]Re-enable after demo with more sites. [cite: 158] | [cite_start]Already scaffolded [cite: 158] |
| Notifications (in-app) | Simple to build but adds complexity. [cite_start]Polling every 5s covers demo. [cite: 158] | [cite_start]3 days [cite: 158] |
| Agent invitation system (admin-generated links) | 3 hardcoded users sufficient for demo. [cite_start]Build before opening to real agents. [cite: 158] | [cite_start]2 days [cite: 158] |
| Refresh tokens / JWT rotation | [cite_start]Static JWT is insecure for production but acceptable for a 3-user demo. [cite: 158] | [cite_start]1 day [cite: 158] |
| Full-text search with pgvector | Basic search sufficient for demo. [cite_start]Semantic search is a nice MVP upgrade. [cite: 158] | [cite_start]1 week [cite: 158] |
| Scheduling (viewings, follow-ups) | [cite_start]Calendar integration (Google Cal via MCP) is a great MVP feature. [cite: 158] | [cite_start]1 week [cite: 158] |
| Public listing pages (SEO) | `realtyhub.fidt.vn/listing/[id]` accessible without login. [cite_start]Great for sharing to clients. [cite: 158] | [cite_start]3 days [cite: 158] |
| Analytics / reporting dashboard | Deal conversion rates, listing performance. [cite_start]Useful post-demo. [cite: 158] | [cite_start]1 week [cite: 158] |

---

## [cite_start]Timeline Summary [cite: 159]
[cite_start]Total: ~6 weeks solo · ~4 weeks with one additional developer [cite: 161]

| Phase | Focus | Duration | End State |
| :--- | :--- | :--- | :--- |
| Phase 1 | [cite_start]UI Polish — Design system, component library, screen redesign [cite: 160] | [cite_start]~2 weeks [cite: 160] | App looks like Stitch mockups. [cite_start]All existing features polished. [cite: 160] |
| Phase 2 | [cite_start]AI Listing Entry — Voice/text, field extraction, duplicates, geo, follow-up Q&A [cite: 160] | [cite_start]~1.5 weeks [cite: 160] | [cite_start]Centerpiece demo feature works end-to-end with Gemini free tier. [cite: 160] |
| Phase 3 | [cite_start]CRM Full — Sellers, Buyers, Deals funnel with Kanban pipeline [cite: 160] | [cite_start]~1.5 weeks [cite: 160] | [cite_start]Agents can manage clients and see deals in pipeline stages. [cite: 160] |
| Phase 4 | [cite_start]Listings Consolidation — Filter parity, grouped Inquiries, owner highlight [cite: 160] | [cite_start]~0.5 weeks [cite: 160] | [cite_start]Feed and My Listings feel like one coherent system. [cite: 160] |
| Phase 5 | [cite_start]Demo Deployment — Railway + R2 + Cloudflare, 3 users, live URL [cite: 160] | [cite_start]~0.5 weeks [cite: 160] | [cite_start]`realtyhub.fidt.vn` is live, demo-ready, $0/month. [cite: 160] |

---

## [cite_start]Technical Debt to Clear During Demo Build [cite: 162]

| Issue | Fix During Phase | Priority |
| :--- | :--- | :--- |
| BIGINT returned as string from node-postgres — `z.preprocess` needed everywhere | [cite_start]Phase 1 [cite: 163] | [cite_start]High — add shared `coerceInt`/`coerceBigInt` helpers to `lib/db.ts` [cite: 163] |
| Turbopack cache causes stale 404s in dev — requires `.next` wipe | [cite_start]Ongoing [cite: 163] | [cite_start]Low — document workaround, switch to webpack dev if too painful [cite: 163] |
| JWT is static (no expiry / refresh tokens) | [cite_start]Phase 5 (deploy) [cite: 163] | [cite_start]Medium — add 7-day expiry + refresh before live URL goes out [cite: 163] |
| No automated tests | [cite_start]Phase 2 (AI routes) [cite: 163] | [cite_start]Medium — add Playwright tests for login + listing create + AI parse [cite: 163] |
| dev server slow (cold compilation) | [cite_start]Phase 5 [cite: 163] | [cite_start]Resolved by production build on Railway [cite: 163] |
| `cho_thue` → `ban` migration fix from Session 6 | [cite_start]Phase 1 (DB check) [cite: 163] | [cite_start]Done — verify migration 005 applied correctly on new Railway DB [cite: 163] |

---

[cite_start]**ProMemo Demo Roadmap · fidt.vn / Wealth Realty · github: fidt-vn-re** [cite: 164]
[cite_start]**Stack:** Next.js 15 · PostgreSQL · Leaflet/OSM · Gemini 1.5 Flash · Railway · Cloudflare R2 [cite: 165]