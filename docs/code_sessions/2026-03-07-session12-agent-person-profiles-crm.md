## Session 12 — 2026-03-07 — Agent & Person Profiles, Message Property Bar, CRM Filters

### Summary

Recreated agent profile (My Profile and read-only Agent Profile) per Stitch mockups; made each CRM person (seller/buyer) clickable to a full person profile; added associated property bar at the top of each message thread; added agent filters (All / Favorite / Active) in CRM Agents tab. Documented in SESSION_LOG and related docs.

### Changes Made

- **My Profile** (`/dashboard/profile`): Stitch-style layout — gradient header, avatar (initials), name, username, Add Listing + Preview buttons; "Shared on Listings" section with Phone and Email; design tokens throughout.
- **Agent Profile** (`/dashboard/agents/[id]`): Read-only profile for any agent — gradient card, avatar, name, listing count, Message and Favorite (star) buttons; Contact section; Listings list (thumbnail, ward, price) linking to full listing view. GET `/api/agents/[id]` returns agent, listing_count, is_favorited, and up to 10 recent listings with primary_photo.
- **CRM Favorites**: GET `/api/crm/favorites` returns `agent_ids`; POST `/api/crm/favorites` with `favorited_agent_id` toggles favorite (uses `agent_favorites` table from migration 008).
- **CRM Agents tab**: Filter chips **All** | **Favorite** | **Active**. Favorite = agents in agent_favorites for current user. Active = agents the current user has at least one conversation with (derived from GET `/api/conversations`). Each agent row links to `/dashboard/agents/[id]` (name/avatar); Message link unchanged.
- **Person profile** (`/dashboard/crm/person/[id]`): Full seller/buyer view — avatar, name, status badge; Contact (phone, email, zalo, notes); Associated listings with link to listing view and rating (buyers); "Create deal" button. Fetches GET `/api/persons/[id]` and GET `/api/person-listings?person_id=`.
- **CRM Sellers/Buyers**: Each person row is clickable (row click → person profile). "Create deal" and "Listings (n)" / expand use stopPropagation so they don't navigate away.
- **Message thread** (`/dashboard/messages/[conversationId]`): When conversation has `listing_id`, a **property bar** appears below the header — listing thumbnail (or placeholder), title (ward or listing #), price · area · type, and link to full listing view (`?from=messages`). Conversations API now returns `listing_primary_photo` (subquery on listing_photos).
- **Types**: `Conversation` in `lib/types.ts` extended with `listing_primary_photo?: string | null`.

### Recommendations for Next Session

- Agent avatars: optional avatar_url on agents table and upload flow for stock/real photos.
- Person profile: document uploads and interaction history log (deal_events) per roadmap.
- Stitch mockups live in `stitch_property_details_view/` for reference (e.g. my_agent_profile, agent_chat_thread, agent_directory).
