# Session 35: API Rate Limiting + Notification System
**Date:** 2026-03-25

### Summary
Infrastructure session focused on two features: API rate limiting and an in-app notification system. Rate limiting uses an in-memory sliding window approach suitable for the single-instance internal app. The notification system covers the full stack from DB schema through API to UI, with fire-and-forget notification creation wired into message and listing creation flows. REA-18 (GCS photo migration) was skipped as it requires infrastructure prerequisites (bucket, service account).

### Technical Details & Fixes
* **Features Delivered:**
  - In-memory sliding window rate limiter with per-route configs (default 60/min, auth 10/min, AI 10/min, uploads 30/min)
  - Middleware expanded from dashboard-only auth to also handle API rate limiting on all `/api/*` routes
  - `notifications` table (migration 021) with partial indexes for efficient unread queries
  - `GET/POST /api/notifications` — list notifications (with unread filter), mark read, mark all read
  - Fire-and-forget `notifyNewMessage()` and `notifyNewListing()` helpers
  - Bell icon with unread count badge in TopBar, polled every 30s
  - Full notifications page with type-specific icons, read/unread styling, relative time formatting
* **Architecture/DB Changes:** Migration 021 adds `notifications` table with two indexes (partial unread index, general agent+created_at index)
* **Challenges Resolved:** None — clean implementation session

### Files Touched
- `web/src/lib/rate-limit.ts` (new)
- `web/src/middleware.ts` (expanded)
- `src/db/migrations/021_notifications.sql` (new)
- `web/src/app/api/notifications/route.ts` (new)
- `web/src/lib/notifications.ts` (new)
- `web/src/app/api/conversations/[id]/messages/route.ts` (added notification call)
- `web/src/app/api/listings/route.ts` (added notification call)
- `web/src/components/ui/TopBar.tsx` (bell icon + badge)
- `web/src/app/dashboard/layout.tsx` (notification count polling)
- `web/src/app/dashboard/notifications/page.tsx` (new)
- `web/src/lib/i18n.ts` (notification-related keys)
- `docs/SCOPE.md`, `docs/CHANGELOG.md`
