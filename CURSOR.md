# CURSOR.md — ProMemo Demo Build Instructions
# fidt-vn-re · Wealth Realty Internal Agent Platform
# Last updated: March 2026

> **Read this entire file before touching a single line of code.**
> This is the authoritative source of truth for this session.
> Every decision in here has a reason. Don't second-guess it — execute it.

---

## 0. What You're Building (30-second brief)

ProMemo is a **closed internal tool** for Wealth Realty real estate agents at fidt.vn.
Three demo agents share property listings, message each other, and manage buyers/sellers.

**Today's goal**: Transform the existing functional-but-bare Next.js app into a
polished, demo-ready product matching the FIDT dark-theme design system.
No new backend features. No AI features yet. UI polish + CRM first.

**Stack confirmed working:**
- Next.js 15 (App Router) · TypeScript · Tailwind v4 · React 19
- PostgreSQL (raw pg Pool, no ORM) · bcrypt + JWT (httpOnly cookie)
- react-leaflet (OSM maps) · local file uploads at /app/uploads/
- Docker Compose: `app-postgres:5432`, `web:8888`, `pgadmin:5050`, `redis:6379`

**Kestra is commented out for Demo** (see Section 2.1 — do this first).

---

## 1. Decisions Made (don't re-litigate these)

### Infrastructure: GCP, not Railway

You have GCP credits. Use them. Here's the decision:

| Question | Answer |
|---|---|
| Where to run the app? | **Cloud Run** (GCP managed containers, scales to zero, HTTPS automatic) |
| Database? | **Cloud SQL for PostgreSQL** (managed, automatic backups, same pg interface) |
| File storage? | **Cloud Storage (GCS)** bucket for photos/docs (S3-compatible via XML API) |
| BigQuery? | **Not for Demo.** BigQuery is OLAP (analytics). Our app needs OLTP (transactions). Cloud SQL is correct. BigQuery = post-MVP analytics layer when you want to query across all agents' deal history. |
| DuckDB on GCP? | Also no for Demo. DuckDB is embedded OLAP — great for local analytics scripts, not for a live web app with concurrent writes. Note it for future: run DuckDB locally against exported BigQuery snapshots for ad-hoc analysis. |
| Maps? | OSM + Leaflet, already integrated, stays. |
| Geocoding? | Nominatim, already integrated, stays. |
| AI (scaffolded now)? | Gemini 1.5 Flash via Google AI Studio key (not Vertex for Demo — simpler auth). |

**GCP deployment happens LAST** (after demo is polished). Focus is UI + CRM today.

### Language Switcher: EN ↔ VN

- Global toggle in top nav bar (flag button: 🇻🇳 / 🇬🇧)
- Stored in localStorage as `lang: 'en' | 'vi'`
- Implemented as a React context (`LanguageContext`) + `useLanguage()` hook
- Translation file: `web/src/lib/i18n.ts` — flat key-value object, both languages in one file
- Per-listing "Translate" button: calls `GET /api/translate?text=...&target=en` (or `vi`)
  - Uses Google Cloud Translation API (you have GCP credits — enable Cloud Translation API, ~$20/1M chars, free tier 500k chars/month)
  - Scaffold the route now; wire the real API key in ENV later
  - Button label: EN mode shows "🌐 Dịch sang Tiếng Việt" · VN mode shows "🌐 Translate to English"
- DO NOT use a heavy i18n library (next-intl, react-i18next). The flat object is sufficient for demo scale.

### Kestra

Comment out in docker-compose.yml. Do NOT delete. See Section 2.1.

---

## 2. First Things First (do these before UI work)

### 2.1 Comment Out Kestra in docker-compose.yml

Open `docker-compose.yml`. Find all Kestra-related services and comment them out:
- `kestra-postgres` service
- `kestra` service  
- `kestra-restore` service

Keep: `app-postgres`, `web`, `pgadmin`, `redis`.

Add a comment above each commented block:
```yaml
# DEMO: Kestra disabled — re-enable for MVP pipeline work
# kestra-postgres:
#   ...
```

After editing, run `docker compose up -d` and verify only 4 services start.

### 2.2 Run Migration 008 — CRM Tables

Create `src/db/migrations/008_crm_schema.sql`:

```sql
-- Migration 008: CRM — Persons (Buyers/Sellers), Deals, Interactions
-- Run: docker exec -i re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang < src/db/migrations/008_crm_schema.sql

-- Persons (buyers and sellers — NOT agents, those stay in agents table)
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('buyer', 'seller')),
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(30),
  zalo VARCHAR(100),
  email VARCHAR(200),
  notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'lead'
    CHECK (status IN ('lead','engaged','considering','viewing','negotiating','closing','won','lost')),
  created_by_agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Buyer-specific criteria (stored as JSONB for flexibility)
ALTER TABLE persons ADD COLUMN IF NOT EXISTS buyer_criteria JSONB;
-- buyer_criteria shape: { budget_min, budget_max, property_types[], preferred_wards[],
--                         area_min, area_max, must_haves: { elevator, parking, direction, legal } }

-- Person <-> Listing associations
CREATE TABLE IF NOT EXISTS person_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES parsed_listings(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('buyer_interest','seller','co_agent')),
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(person_id, listing_id, role)
);

-- Deals (one per sales attempt on a listing)
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id INTEGER REFERENCES parsed_listings(id) ON DELETE SET NULL,
  buyer_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  seller_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
  stage VARCHAR(30) NOT NULL DEFAULT 'lead'
    CHECK (stage IN ('lead','engaged','considering','viewing','negotiating','closing','won','lost')),
  stage_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  value_vnd BIGINT,
  notes TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deal event log (immutable append-only)
CREATE TABLE IF NOT EXISTS deal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  event_type VARCHAR(40) NOT NULL
    CHECK (event_type IN ('stage_change','note','call','viewing','offer','contract','close','other')),
  from_stage VARCHAR(30),
  to_stage VARCHAR(30),
  notes TEXT,
  created_by_agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Person documents
CREATE TABLE IF NOT EXISTS person_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  doc_type VARCHAR(50) DEFAULT 'other',
  original_name VARCHAR(255),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_persons_agent ON persons(created_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_persons_type ON persons(type);
CREATE INDEX IF NOT EXISTS idx_persons_status ON persons(status);
CREATE INDEX IF NOT EXISTS idx_deals_agent ON deals(agent_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deal_events_deal ON deal_events(deal_id);

-- Agent favorites (if not already exists from earlier migration)
CREATE TABLE IF NOT EXISTS agent_favorites (
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  favorited_agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (agent_id, favorited_agent_id)
);
```

Run it:
```bash
docker exec -i re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang \
  < src/db/migrations/008_crm_schema.sql
```

Also update `src/db/init_db.sql` to include these tables at the bottom so fresh installs get them.

### 2.3 Seed Three Demo Users

Create `scripts/seed_demo_users.sh`:

```bash
#!/bin/bash
# Seeds 3 demo agents. Run once on fresh DB.
# Usage: ./scripts/seed_demo_users.sh

CONTAINER="re-nhatrang-app-postgres-1"

docker exec -i $CONTAINER psql -U re_nhatrang -d re_nhatrang <<'SQL'
-- Demo users (passwords will be set via create_agent.sh which hashes with bcrypt)
-- Run create_agent.sh for each instead, as it handles bcrypt hashing:
SELECT 'Use create_agent.sh to create users with hashed passwords' as note;
SQL

echo "Run these commands to create demo users:"
echo "  ./scripts/create_agent.sh dean 'Dean Nguyen' demo123 '0868331111' 'dean@fidt.vn'"
echo "  ./scripts/create_agent.sh sarah 'Sarah Tran' demo123 '0909123456' 'sarah@fidt.vn'"  
echo "  ./scripts/create_agent.sh minh 'Minh Le' demo123 '0901234567' 'minh@fidt.vn'"
```

Run `create_agent.sh` for all three. Document credentials in USAGE.md:
```
Demo Accounts (password: demo123):
  dean / dean@fidt.vn — Senior Broker, Nha Trang
  sarah / sarah@fidt.vn — Associate, HCMC  
  minh / minh@fidt.vn — Junior Agent, Hanoi
```

### 2.4 Add i18n Foundation

Create `web/src/lib/i18n.ts`:

```typescript
export type Lang = 'en' | 'vi';

export const translations = {
  en: {
    // Nav
    feed: 'Feed',
    myListings: 'My Listings',
    inquiries: 'Inquiries',
    crm: 'CRM',
    myProfile: 'My Profile',
    // Listing statuses
    open: 'Open',
    negotiating: 'Negotiating',
    pendingClosing: 'Pending Closing',
    sold: 'Sold',
    notForSale: 'Not For Sale',
    // Listing fields
    forSale: 'For Sale',
    forRent: 'For Rent',
    price: 'Price',
    area: 'Area',
    address: 'Address',
    province: 'Province',
    district: 'District',
    ward: 'Ward',
    description: 'Description',
    propertyType: 'Property Type',
    legalStatus: 'Legal Status',
    direction: 'Direction',
    furnished: 'Furnished',
    stories: 'Stories',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    garage: 'Garage',
    elevator: 'Elevator',
    // Actions
    message: 'Message',
    viewMessages: 'View Messages',
    edit: 'Edit',
    archive: 'Archive',
    publish: 'Publish',
    cancel: 'Cancel',
    save: 'Save',
    addListing: 'Add Listing',
    translateToVi: '🌐 Dịch sang Tiếng Việt',
    translateToEn: '🌐 Translate to English',
    // CRM
    buyers: 'Buyers',
    sellers: 'Sellers',
    agents: 'Agents',
    deals: 'Deals',
    addBuyer: 'Add Buyer',
    addSeller: 'Add Seller',
    // Deal stages
    lead: 'Cold Lead',
    engaged: 'Engaged',
    considering: 'Considering',
    viewing: 'Viewing',
    negotiating_deal: 'Negotiating',
    closing: 'Closing',
    won: 'Closed — Won',
    lost: 'Closed — Lost',
    // Misc
    loading: 'Loading...',
    noResults: 'No results found',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    mapView: 'Map View',
    gridView: 'Grid View',
    shareLink: 'Share Link',
    linkCopied: 'Link copied!',
  },
  vi: {
    // Nav
    feed: 'Bảng tin',
    myListings: 'BĐS của tôi',
    inquiries: 'Tin nhắn',
    crm: 'Khách hàng',
    myProfile: 'Hồ sơ',
    // Listing statuses
    open: 'Đang bán',
    negotiating: 'Đang thương lượng',
    pendingClosing: 'Chờ ký hợp đồng',
    sold: 'Đã bán',
    notForSale: 'Không bán',
    // Listing fields
    forSale: 'Bán',
    forRent: 'Cho thuê',
    price: 'Giá',
    area: 'Diện tích',
    address: 'Địa chỉ',
    province: 'Tỉnh/Thành phố',
    district: 'Quận/Huyện',
    ward: 'Phường/Xã',
    description: 'Mô tả',
    propertyType: 'Loại BĐS',
    legalStatus: 'Pháp lý',
    direction: 'Hướng',
    furnished: 'Nội thất',
    stories: 'Số tầng',
    bedrooms: 'Phòng ngủ',
    bathrooms: 'Phòng tắm',
    garage: 'Garage',
    elevator: 'Thang máy',
    // Actions
    message: 'Nhắn tin',
    viewMessages: 'Xem tin nhắn',
    edit: 'Chỉnh sửa',
    archive: 'Lưu trữ',
    publish: 'Đăng tin',
    cancel: 'Huỷ',
    save: 'Lưu',
    addListing: 'Thêm BĐS',
    translateToVi: '🌐 Dịch sang Tiếng Việt',
    translateToEn: '🌐 Translate to English',
    // CRM
    buyers: 'Người mua',
    sellers: 'Người bán',
    agents: 'Môi giới',
    deals: 'Giao dịch',
    addBuyer: 'Thêm người mua',
    addSeller: 'Thêm người bán',
    // Deal stages
    lead: 'Tiềm năng',
    engaged: 'Đã liên hệ',
    considering: 'Đang xem xét',
    viewing: 'Đang xem nhà',
    negotiating_deal: 'Đang thương lượng',
    closing: 'Đang ký hợp đồng',
    won: 'Đã thành công',
    lost: 'Không thành',
    // Misc
    loading: 'Đang tải...',
    noResults: 'Không tìm thấy kết quả',
    search: 'Tìm kiếm',
    filter: 'Lọc',
    sort: 'Sắp xếp',
    mapView: 'Xem bản đồ',
    gridView: 'Xem lưới',
    shareLink: 'Chia sẻ',
    linkCopied: 'Đã sao chép!',
  },
} satisfies Record<Lang, Record<string, string>>;

export type TranslationKey = keyof typeof translations.en;
```

Create `web/src/contexts/LanguageContext.tsx`:

```typescript
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lang, translations, TranslationKey } from '@/lib/i18n';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem('promemo_lang') as Lang | null;
    if (stored === 'en' || stored === 'vi') setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('promemo_lang', l);
  };

  const t = (key: TranslationKey): string => translations[lang][key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
```

Add `<LanguageProvider>` to `web/src/app/providers.tsx` wrapping `<AuthProvider>`.

---

## 3. Design System (implement in this exact order)

### 3.1 CSS Variables — globals.css

Replace the existing CSS in `web/src/app/globals.css` with this. Keep any existing
`@import` for Tailwind. Add these variables:

```css
:root {
  color-scheme: light; /* forces consistent rendering even in dark OS mode */

  /* Brand */
  --orange: #E87722;
  --orange-dim: #C4641A;
  --orange-glow: rgba(232, 119, 34, 0.15);

  /* Backgrounds — dark layered system */
  --bg-base: #111827;       /* page background */
  --bg-surface: #1E2A3B;    /* cards, panels */
  --bg-elevated: #243347;   /* modals, dropdowns */
  --bg-hover: #2C3D52;      /* hover states */
  --bg-input: #192231;      /* input fields */

  /* Borders */
  --border: #2D3F55;
  --border-subtle: #1E2D3F;
  --border-focus: #E87722;

  /* Text */
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --text-inverse: #111827;

  /* Status colors */
  --status-open: #16A34A;
  --status-negotiating: #E87722;
  --status-pending: #CA8A04;
  --status-sold: #DC2626;
  --status-nfs: #475569;

  /* Semantic */
  --success: #22C55E;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;

  /* Radius */
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 14px;
  --r-xl: 20px;
  --r-full: 9999px;

  /* Shadows */
  --shadow-card: 0 2px 16px rgba(0,0,0,0.4);
  --shadow-elevated: 0 8px 32px rgba(0,0,0,0.6);
  --shadow-orange: 0 0 20px rgba(232, 119, 34, 0.3);
}

* { box-sizing: border-box; }

body {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: 'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

/* Remove default blue outline, use orange instead */
:focus-visible {
  outline: 2px solid var(--orange);
  outline-offset: 2px;
}
```

### 3.2 Font — Add DM Sans

In `web/src/app/layout.tsx`, add DM Sans via next/font:

```typescript
import { DM_Sans } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

// In the <html> tag:
<html className={dmSans.variable}>
```

DM Sans is clean, modern, slightly geometric — it's professional without being generic.
It reads well in Vietnamese (correct diacritics rendering).

### 3.3 Tailwind Config Extensions

In `web/tailwind.config.ts` (or equivalent for Tailwind v4), add these to extend:

```typescript
theme: {
  extend: {
    colors: {
      orange: '#E87722',
      'orange-dim': '#C4641A',
      navy: '#111827',
      surface: '#1E2A3B',
      elevated: '#243347',
      'bg-hover': '#2C3D52',
      'bg-input': '#192231',
      border: '#2D3F55',
      'text-primary': '#F1F5F9',
      'text-secondary': '#94A3B8',
      'text-muted': '#64748B',
      'status-open': '#16A34A',
      'status-negotiating': '#E87722',
      'status-pending': '#CA8A04',
      'status-sold': '#DC2626',
      'status-nfs': '#475569',
    },
    fontFamily: {
      sans: ['var(--font-dm-sans)', 'system-ui'],
    },
    borderRadius: {
      sm: '6px', md: '10px', lg: '14px', xl: '20px',
    },
    boxShadow: {
      card: '0 2px 16px rgba(0,0,0,0.4)',
      elevated: '0 8px 32px rgba(0,0,0,0.6)',
      orange: '0 0 20px rgba(232, 119, 34, 0.3)',
    },
  }
}
```

---

## 4. Shared Component Library

Build these in `web/src/components/ui/`. Each is a single file.
Use CSS variables + Tailwind classes. No external component libraries.

### 4.1 StatusBadge.tsx

```typescript
// web/src/components/ui/StatusBadge.tsx
import { useLanguage } from '@/contexts/LanguageContext';

type Status = 'for_sale' | 'in_negotiations' | 'pending_closing' | 'sold' | 'not_for_sale';

const STATUS_MAP: Record<Status, { color: string; key: 'open'|'negotiating'|'pendingClosing'|'sold'|'notForSale' }> = {
  for_sale:        { color: 'var(--status-open)',        key: 'open' },
  in_negotiations: { color: 'var(--status-negotiating)', key: 'negotiating' },
  pending_closing: { color: 'var(--status-pending)',     key: 'pendingClosing' },
  sold:            { color: 'var(--status-sold)',        key: 'sold' },
  not_for_sale:    { color: 'var(--status-nfs)',         key: 'notForSale' },
};

export function StatusBadge({ status, size = 'sm' }: { status: Status; size?: 'sm' | 'md' }) {
  const { t } = useLanguage();
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.for_sale;
  return (
    <span style={{ backgroundColor: cfg.color }}
      className={`inline-flex items-center font-semibold text-white rounded-full uppercase tracking-wide
        ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'}`}>
      {t(cfg.key)}
    </span>
  );
}
```

### 4.2 PriceDisplay.tsx

```typescript
// web/src/components/ui/PriceDisplay.tsx
// Formats VND price as "7.5 Tỷ" with optional USD conversion
// Exchange rate: use a hardcoded rate for demo (1 USD ≈ 25,000 VND)
const VND_TO_USD = 25000;

export function PriceDisplay({
  vnd, showUsd = false, size = 'md', strikethrough = false
}: {
  vnd: number | null;
  showUsd?: boolean;
  size?: 'sm' | 'md' | 'lg';
  strikethrough?: boolean;
}) {
  if (!vnd) return <span className="text-text-muted">—</span>;

  const billions = vnd / 1_000_000_000;
  const millions = vnd / 1_000_000;
  const formatted = billions >= 1
    ? `${billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)} Tỷ`
    : `${millions.toFixed(0)} Tr`;
  const usd = Math.round(vnd / VND_TO_USD).toLocaleString('en-US');

  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' };

  return (
    <div>
      <span className={`font-bold text-white ${sizes[size]} ${strikethrough ? 'line-through text-text-muted' : ''}`}>
        {formatted} ₫
      </span>
      {showUsd && (
        <div className="text-text-secondary text-sm">≈ ${usd} USD</div>
      )}
    </div>
  );
}
```

### 4.3 AgentChip.tsx

```typescript
// web/src/components/ui/AgentChip.tsx
import Link from 'next/link';

interface AgentChipProps {
  agent: { id: number; first_name: string; username: string; phone?: string };
  size?: 'sm' | 'md';
  showOnline?: boolean;
  clickable?: boolean;
}

export function AgentChip({ agent, size = 'sm', showOnline = false, clickable = true }: AgentChipProps) {
  const initials = agent.first_name.slice(0, 2).toUpperCase();
  const inner = (
    <div className={`flex items-center gap-2 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <div className="relative flex-shrink-0">
        <div className={`rounded-full bg-orange flex items-center justify-center font-bold text-white
          ${size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'}`}>
          {initials}
        </div>
        {showOnline && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-status-open rounded-full border border-surface" />
        )}
      </div>
      <span className="text-text-secondary font-medium">{agent.first_name}</span>
    </div>
  );

  if (!clickable) return inner;
  return (
    <Link href={`/dashboard/agents/${agent.id}`} className="hover:opacity-80 transition-opacity">
      {inner}
    </Link>
  );
}
```

### 4.4 BottomNav.tsx

```typescript
// web/src/components/ui/BottomNav.tsx
// THE uniform bottom navigation — same on every screen
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, Building2, MessageSquare, Users, UserCircle } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'feed',       href: '/dashboard/feed',     icon: Home,           tKey: 'feed'       },
  { key: 'listings',   href: '/dashboard/listings', icon: Building2,      tKey: 'myListings' },
  { key: 'inquiries',  href: '/dashboard/messages', icon: MessageSquare,  tKey: 'inquiries'  },
  { key: 'crm',        href: '/dashboard/crm',      icon: Users,          tKey: 'crm'        },
  { key: 'profile',    href: '/dashboard/profile',  icon: UserCircle,     tKey: 'myProfile'  },
] as const;

export function BottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border
                    flex items-center justify-around px-2 pb-safe-area-inset-bottom"
         style={{ height: '60px', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV_ITEMS.map(({ key, href, icon: Icon, tKey }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={key} href={href}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full
              transition-colors duration-150 relative
              ${active ? 'text-orange' : 'text-text-muted hover:text-text-secondary'}`}>
            <div className="relative">
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              {key === 'inquiries' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-error text-white
                  text-[9px] font-bold rounded-full min-w-[14px] h-[14px]
                  flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {active && (
              <span className="text-[9px] font-semibold tracking-wide uppercase">
                {t(tKey)}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
```

### 4.5 TopBar.tsx

```typescript
// web/src/components/ui/TopBar.tsx
'use client';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { LangSwitcher } from './LangSwitcher';

interface TopBarProps {
  back?: boolean;           // show back arrow instead of logo
  backHref?: string;
  title?: string;           // optional page title (shown when back=true)
  actions?: React.ReactNode; // right side icons
}

export function TopBar({ back, backHref, title, actions }: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm
                       border-b border-border flex items-center h-14 px-4 gap-3">
      {/* Left */}
      <div className="w-10 flex-shrink-0">
        {back && (
          <Link href={backHref ?? '#'} className="flex items-center text-text-secondary hover:text-white">
            <ArrowLeft size={20} />
          </Link>
        )}
      </div>

      {/* Center */}
      <div className="flex-1 flex items-center justify-center">
        {title ? (
          <h1 className="text-sm font-semibold text-white truncate">{title}</h1>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-orange rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-black tracking-tight">FIDT</span>
            </div>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="w-10 flex-shrink-0 flex items-center justify-end gap-2">
        <LangSwitcher />
        {actions}
      </div>
    </header>
  );
}
```

### 4.6 LangSwitcher.tsx

```typescript
// web/src/components/ui/LangSwitcher.tsx
'use client';
import { useLanguage } from '@/contexts/LanguageContext';

export function LangSwitcher() {
  const { lang, setLang } = useLanguage();
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
      className="text-[11px] font-bold text-text-secondary hover:text-orange
                 transition-colors border border-border rounded px-1.5 py-0.5"
      title={lang === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang Tiếng Anh'}>
      {lang === 'en' ? '🇻🇳' : '🇬🇧'}
    </button>
  );
}
```

### 4.7 ListingCard.tsx

Replace the existing `web/src/components/feed/FeedCard.tsx` with this.
Keep the same component name (FeedCard) to avoid changing imports everywhere,
or create a new ListingCard.tsx and gradually migrate.

```typescript
// web/src/components/ui/ListingCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { PriceDisplay } from './PriceDisplay';
import { AgentChip } from './AgentChip';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageSquare, Eye } from 'lucide-react';
import type { ParsedListing } from '@/lib/types';

interface ListingCardProps {
  listing: ParsedListing & { agent?: any; has_conversation?: boolean; is_owner?: boolean };
  cols?: 1 | 2 | 3;      // grid column context — affects layout
  onMessage?: () => void;
  onViewMessages?: () => void;
}

export function ListingCard({ listing, cols = 2, onMessage, onViewMessages }: ListingCardProps) {
  const { t } = useLanguage();
  const photoUrl = listing.photos?.[0]?.file_path
    ? `/api/files/${listing.photos[0].file_path}`
    : null;

  return (
    <div className={`relative rounded-lg overflow-hidden bg-surface border border-border
      ${listing.is_owner ? 'ring-1 ring-orange/40' : ''}
      shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200`}>

      {/* Photo */}
      <Link href={`/dashboard/listings/${listing.id}/view`}>
        <div className={`relative w-full bg-elevated ${cols === 1 ? 'h-48' : 'h-36'}`}>
          {photoUrl ? (
            <Image src={photoUrl} alt={listing.street ?? 'listing'} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted">
              <Building2Icon />
            </div>
          )}
          {/* Status badge overlay */}
          <div className="absolute top-2 left-2">
            <StatusBadge status={listing.status ?? 'for_sale'} />
          </div>
          {/* Owner indicator */}
          {listing.is_owner && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange shadow-orange" />
          )}
          {/* Photo count */}
          {listing.photos && listing.photos.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
              1/{listing.photos.length}
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-3">
        <PriceDisplay vnd={listing.price_vnd} size="sm" />

        <p className="text-text-secondary text-xs mt-1 truncate">
          {[listing.street, listing.ward, listing.district].filter(Boolean).join(', ')}
        </p>

        {/* Specs row */}
        <div className="flex items-center gap-3 mt-2 text-[11px] text-text-muted">
          {listing.area_m2 && <span>{listing.area_m2}m²</span>}
          {listing.num_bedrooms && <span>{listing.num_bedrooms} PN</span>}
          {listing.num_bathrooms && <span>{listing.num_bathrooms} WC</span>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          {listing.agent && <AgentChip agent={listing.agent} />}

          <div className="ml-auto">
            {listing.is_owner ? (
              <button onClick={onViewMessages}
                className="flex items-center gap-1 text-[11px] font-medium text-info
                  border border-info/30 rounded-md px-2 py-1 hover:bg-info/10 transition-colors">
                <Eye size={12} /> {t('viewMessages')}
              </button>
            ) : listing.has_conversation ? (
              <button onClick={onViewMessages}
                className="flex items-center gap-1 text-[11px] font-medium text-info
                  border border-info/30 rounded-md px-2 py-1 hover:bg-info/10 transition-colors">
                <MessageSquare size={12} /> {t('viewMessages')}
              </button>
            ) : (
              <button onClick={onMessage}
                className="flex items-center gap-1 text-[11px] font-medium text-orange
                  border border-orange/30 rounded-md px-2 py-1 hover:bg-orange/10 transition-colors">
                <MessageSquare size={12} /> {t('message')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Building2Icon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 21h18M9 21V5a2 2 0 012-2h2a2 2 0 012 2v16M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/>
    </svg>
  );
}
```

### 4.8 GridToggle.tsx

```typescript
// web/src/components/ui/GridToggle.tsx
import { LayoutGrid, Grid3X3, Square } from 'lucide-react';

type GridCols = 1 | 2 | 3;

export function GridToggle({ value, onChange }: { value: GridCols; onChange: (v: GridCols) => void }) {
  return (
    <div className="flex items-center bg-elevated rounded-md p-0.5 gap-0.5">
      {([1, 2, 3] as GridCols[]).map(n => {
        const Icon = n === 1 ? Square : n === 2 ? Grid3X3 : LayoutGrid;
        return (
          <button key={n} onClick={() => onChange(n)}
            className={`p-1.5 rounded transition-colors ${
              value === n ? 'bg-orange text-white' : 'text-text-muted hover:text-white'
            }`}>
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
```

### 4.9 TranslateButton.tsx (AI scaffold — wired but shows "coming soon" for now)

```typescript
// web/src/components/ui/TranslateButton.tsx
'use client';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

interface TranslateButtonProps {
  text: string;
  onTranslated: (result: string) => void;
}

export function TranslateButton({ text, onTranslated }: TranslateButtonProps) {
  const { lang, t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const target = lang === 'en' ? 'vi' : 'en';
      const res = await fetch(`/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target }),
      });
      if (res.ok) {
        const { translated } = await res.json();
        onTranslated(translated);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleTranslate} disabled={loading}
      className="flex items-center gap-1.5 text-xs text-text-secondary
        border border-border rounded px-2.5 py-1.5 hover:border-orange hover:text-orange
        transition-colors disabled:opacity-50">
      <Globe size={13} />
      {loading ? 'Translating...' : lang === 'en' ? t('translateToVi') : t('translateToEn')}
    </button>
  );
}
```

Create the scaffold API route `web/src/app/api/translate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text, target } = await req.json();
  
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  
  if (!apiKey) {
    // Scaffold: return mock translation for demo if no key configured
    return NextResponse.json({
      translated: `[Translation to ${target} — configure GOOGLE_TRANSLATE_API_KEY to enable]`,
      mock: true,
    });
  }

  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target, format: 'text' }),
      }
    );
    const data = await res.json();
    const translated = data.data?.translations?.[0]?.translatedText ?? text;
    return NextResponse.json({ translated });
  } catch (e) {
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
```

---

## 5. Screen Overhauls (implement in this order)

### 5.1 Dashboard Layout — web/src/app/dashboard/layout.tsx

Replace the existing layout. Keep all auth logic. Replace nav with BottomNav + TopBar:

```typescript
// KEEP: auth guard logic (useAuth, redirect)
// REPLACE: the nav rendering

// Layout structure:
// <div className="min-h-screen bg-navy">
//   <TopBar />  ← fixed, h-14
//   <main className="pt-14 pb-16">  ← padding for top+bottom nav
//     {children}
//   </main>
//   <BottomNav unreadCount={unreadCount} />  ← fixed, h-15
// </div>

// Fetch unreadCount in layout via server component or poll from API
// GET /api/messages/unread-count → { count: number }
// Add this API route if it doesn't exist
```

### 5.2 Feed Page — web/src/app/dashboard/feed/page.tsx

Keep all data fetching. Replace rendering:

```typescript
// TOP BAR (fixed):
//   logo center | search icon + filter icon right | lang switcher

// CONTROLS ROW (below TopBar, sticky):
//   [GridToggle] -------- [MapView toggle switch]
//   [Scrollable filter chips: active filters with × to dismiss]

// GRID:
//   <div className={`grid gap-3 p-3 ${
//     cols === 1 ? 'grid-cols-1' :
//     cols === 2 ? 'grid-cols-2' :
//     'grid-cols-3'
//   }`}>
//     {listings.map(l => <ListingCard key={l.id} listing={l} cols={cols} ... />)}
//   </div>

// MAP VIEW:
//   Already integrated — just restyle the container and price pins
//   Map pins: orange rounded rect with "X.XB" price text
//   Selected listing: bottom sheet with ListingCard

// State: cols (1|2|3), viewMode ('grid'|'map'), filters, page
```

### 5.3 My Listings Page — web/src/app/dashboard/listings/page.tsx

Keep all data fetching. Replace rendering:

```typescript
// TOP BAR: "WEALTH REALTY / My Listings" + + button right

// STATUS FILTER TABS (scrollable horizontal):
//   All | Active | Negotiating | Pending | Sold | Archived
//   Active tab: orange bottom border + text

// GRID: same as Feed but listing.is_owner = true
//   Owner highlight: orange left border: border-l-2 border-orange

// EACH CARD has 3-dot menu (BottomSheet on mobile):
//   Edit → /dashboard/listings/[id]/edit
//   Archive → confirm dialog → archive API
//   View Inquiries → /dashboard/messages?listing=[id]
```

### 5.4 Full Listing View — web/src/app/dashboard/listings/[id]/view/page.tsx

This is the most detailed screen. Build carefully:

```typescript
// Structure (full screen, top to bottom):

// 1. PHOTO CAROUSEL
//    - Swipeable (use CSS scroll-snap, no library needed)
//    - Height: 260px on mobile
//    - Status badge overlay top-left
//    - Back arrow top-left (fixed over photo)
//    - Share + Favorite icons top-right
//    - Photo counter bottom-right "1/N"

// 2. PRICE BLOCK
//    - Large PriceDisplay (size="lg")
//    - USD conversion below (showUsd=true)
//    - Listing ID badge top-right: "#VN-{id}"

// 3. ADDRESS
//    - Full address, district, province
//    - "📍 Open Maps" link → OSM URL

// 4. OWNER ACTION BAR (only visible if is_owner):
//    <div className="flex gap-2 p-4">
//      <button>Share Link</button>       ← copies URL to clipboard, toast "Copied!"
//      <button>Create Post</button>      ← opens modal (see 5.4.1)
//      <Link href="edit">Edit</Link>
//      <button>Archive</button>
//    </div>

// 5. PROPERTY DETAILS GRID
//    2-column icon cards:
//    Type | Area | Legal | Direction | Furnished | Stories | Bedrooms | Bathrooms
//    Each card: bg-elevated, rounded-lg, icon (orange) + label + value

// 6. TRANSLATE BUTTON
//    Show <TranslateButton text={description} onTranslated={(t) => setTranslatedDesc(t)} />
//    When translated: show translated text below original (collapsible)

// 7. DESCRIPTION
//    Expandable text area (show 3 lines, "Show more" button)
//    TranslateButton here

// 8. MINI MAP (Leaflet, ssr=false)
//    Height: 160px, single pin, no controls
//    Only render if listing.latitude && listing.longitude

// 9. AGENT CARD
//    Avatar (initials), name, title
//    Contact buttons: Phone | Zalo | WhatsApp (only fields agent has enabled)
//    Tappable → agent profile page

// 10. DOCUMENTS SECTION
//     List of uploaded docs with download icons

// 11. STICKY BOTTOM BAR
//     If is_owner and has inquiries: "View X Inquiries" (blue)
//     If is_owner and no inquiries: nothing (or "Share with agents")
//     If not owner and has_conversation: "View Messages" (blue)
//     If not owner and no conversation: "Message Agent" (orange, full width)

// 5.4.1 Create Post Modal (scaffolded)
// A bottom sheet with tabs: Zalo | TikTok | LinkedIn | Facebook | BDS.vn
// Each tab shows an AI-drafted post text (for demo: hardcoded template using listing data)
// "Copy" button on each tab
// "Post" button disabled with tooltip "Available in MVP"
// Real AI drafting → scaffold: generatePostDraft(listing, platform) in lib/ai-scaffold.ts
```

### 5.5 Add/Edit Listing Form — web/src/app/dashboard/listings/new/page.tsx + edit

Restructure the existing ListingForm.tsx into clearly grouped sections.
Keep all existing field logic. Only change the layout and styling:

```typescript
// TOP BAR: Cancel (text, left) | [logo] | Publish (orange text, right)
// Progress bar: thin orange line at very top, fills as required fields complete

// SECTIONS (each is a <section> with a header label):

// MEDIA
//   Photo grid: dashed border "Add Photo" first, then uploaded photos
//   Drag to reorder, tap to set cover (shows COVER badge)
//   Accepts images + PDFs

// BASIC INFO
//   Price (VND) — large input with ₫ prefix
//   For Sale | For Rent — segmented control (orange = active)
//   Property Type — icon grid: Apt | House | Land | Hotel | Office | Retail | Farm
//   (icons from lucide-react, selected = orange border + bg-orange/10)

// LOCATION
//   Province dropdown → District dropdown → Ward dropdown (cascading)
//   Street address text input
//   Leaflet map pin picker (existing geocode integration)
//   "Use photo location" button (scaffold — will use EXIF in MVP)

// SPECIFICATIONS
//   Area m² | Access m — side by side text inputs
//   Stories — stepper (−  2  +)
//   Bedrooms — stepper
//   Bathrooms — stepper
//   Toggles row: Garage | Corner Lot | Elevator | Balcony | Rooftop

// DETAILS
//   Furniture: None | Partial | Full — segmented (3 options)
//   Direction: N | NE | E | SE | S | SW | W | NW — 8-button grid
//   Construction status: dropdown
//   Legal status: Red Book | Pink Book | Other — segmented
//   Price: Firm | Negotiable — toggle
//   Motivation: Low ←————→ High — slider (1-5, stored in notes for now)

// STATUS
//   5-button selector: Open | Negotiating | Pending | Sold | Not For Sale

// DESCRIPTION (freeform)
//   Large textarea (Vietnamese/English)
//   Below: "🤖 Auto-fill fields with AI" button (scaffold — disabled with tooltip in demo)
//   TranslateButton below textarea

// AI SCAFFOLD — do this now so it's wired for MVP:
// Create web/src/lib/ai-scaffold.ts:
// export async function parseListingText(text: string): Promise<Partial<ParsedListing>> {
//   // SCAFFOLD: returns mock data for demo
//   // Real implementation: POST to /api/ai/parse-listing with Gemini
//   console.log('[AI SCAFFOLD] parseListingText called — implement with Gemini in MVP');
//   return {};
// }
// export async function generatePostDraft(listing: ParsedListing, platform: string): Promise<string> {
//   // SCAFFOLD: returns template text
//   const price = formatPrice(listing.price_vnd);
//   return `🏠 ${platform} Post — ${listing.street}, ${listing.ward}\n💰 ${price}\n📐 ${listing.area_m2}m²\n\n[AI draft available in MVP]`;
// }
```

### 5.6 Inquiries (Messages) — web/src/app/dashboard/messages/page.tsx

Keep existing data fetching. Replace rendering:

```typescript
// TOP BAR: "Inquiries" title centered

// GROUP TOGGLE (pills, below search):
//   [All] [By Property] [By Agent]
//   "All" = flat list newest first (existing behavior)
//   "By Property" = group threads by listing_id, collapsible
//   "By Agent" = group threads by other_agent_id, collapsible

// FLAT LIST ROW (MessageRow):
//   Left: agent avatar (initials circle)
//   Center: agent name (bold) + property chip (orange bg, "Ward · Price")
//   Right: timestamp + unread badge (red circle with count)
//   Below name: message preview text (1 line, truncated)

// PRIORITY SECTION (pinned at top if status is negotiating/pending):
//   Header: "🔥 PRIORITY DEALS"
//   Same rows but with orange left border

// COLLAPSIBLE GROUPS (By Property view):
//   Group header: property thumbnail (small) + address + status badge
//   Collapse/expand chevron
//   Indented thread rows below

// Tap any row → /dashboard/messages/[conversationId]
```

### 5.7 Chat Screen — web/src/app/dashboard/messages/[conversationId]/page.tsx

Keep existing polling + send logic. Replace rendering:

```typescript
// TOP BAR:
//   ← back | agent avatar + name + "Online" dot | ☎ phone icon | ⋮ more

// PROPERTY CONTEXT BAR (below TopBar):
//   Small thumbnail | address | StatusBadge | price
//   Entire bar tappable → listing view
//   Thin bar, ~52px height, bg-elevated, border-b

// MESSAGES AREA:
//   Scrollable, padding accounts for both bars at top and input at bottom
//   Date separator: centered pill "TODAY" / "YESTERDAY" / "Mon 3 Mar"
//   Received bubble: bg-elevated, text-primary, left-aligned, max-w-[80%]
//   Sent bubble: bg-orange/20 border border-orange/30, text-primary, right-aligned
//   Timestamp: below each bubble, text-muted text-[10px]

// QUICK ACTION CHIPS (above input):
//   "📅 Schedule Viewing" | "📄 Share Contract" | "❓ Request Info"
//   Tapping inserts template text into input

// INPUT BAR:
//   Attachment icon | text input | emoji icon | send button (orange circle)
//   Enter = send, Shift+Enter = newline (existing behavior)
//   Input: bg-bg-input, rounded-full padding
```

---

## 6. CRM — New Screens

### 6.1 CRM Tab Router — web/src/app/dashboard/crm/page.tsx

```typescript
// This page shows sub-tab navigation: Agents | Sellers | Buyers
// Default tab: Agents
// Sub-tabs: inline pill switcher (not bottom nav)

// URL: /dashboard/crm (agents) | /dashboard/crm?tab=sellers | /dashboard/crm?tab=buyers
// OR use nested routes: /dashboard/crm/agents, /dashboard/crm/sellers, /dashboard/crm/buyers

// Recommendation: use query param (simpler, no new route files)
```

### 6.2 Agents Tab (polish existing)

```typescript
// SEARCH: full-width SearchBar at top
// CITY CHIPS: All | HCMC | Hanoi | Nha Trang | Da Nang (scrollable)
// SORT: "Sort: Listings ▾" button → dropdown: Listings | Name | Favorites

// AGENT ROW:
//   Avatar circle (initials, online dot if last_active within 5min)
//   Name (bold) + title + market/city (secondary)
//   Listings count badge (orange pill)
//   Favorite star (⭐ toggle, persists via /api/crm/favorites)
//   Message bubble icon → opens conversation

// API: GET /api/agents (already exists) + GET /api/crm/favorites
// POST /api/crm/favorites { favorited_agent_id } — toggle favorite
// (uses agent_favorites table from migration 008)
```

### 6.3 Sellers Tab — new

```typescript
// HEADER: "Sellers" + "+ Add Seller" button (orange, top right)

// LIST:
//   Each row: name | phone | status badge | listing count | last interaction date
//   Swipe left → Archive (or 3-dot menu)

// ADD/EDIT SELLER MODAL (bottom sheet on mobile, or full screen):
//   Full Name* | Phone* | Zalo | Email | Notes (textarea)
//   Status selector: Lead → Qualified → Active Listing → Negotiating → Won/Lost
//   Associate Listings: searchable dropdown → adds to person_listings table
//   Save → POST /api/crm/persons { type: 'seller', ... }

// SELLER DETAIL PAGE (/dashboard/crm/persons/[id]):
//   Contact info + quick action buttons (call, Zalo)
//   Associated Listings: mini ListingCards, tappable
//   Document uploads (reuse photo upload component)
//   Interaction History: chronological list of deal_events
//     Each event: icon (call/meeting/note) + notes + timestamp
//   "+ Log Interaction" button → BottomSheet with: type selector + notes + date
```

### 6.4 Buyers Tab — new

```typescript
// Same pattern as Sellers but with buyer criteria section

// BUYER CRITERIA (shown in detail view, editable):
//   Budget: Min [____] — Max [____] VND (formatted)
//   Property Types: multi-select chips (House | Apt | Land | ...)
//   Preferred Wards: multi-select from nha_trang_wards table
//   Area: Min [__] — Max [__] m²
//   Must-haves: toggle chips (Elevator | Parking | Red Book | Pink Book | ...)

// MATCHED LISTINGS section (in buyer detail):
//   Query parsed_listings against buyer_criteria fields
//   Show as ListingCard list with rating stars (1-5, stored in person_listings.rating)
//   API: GET /api/crm/persons/[id]/matches
```

### 6.5 API Routes for CRM

Create these routes. Keep them simple — raw SQL, same pattern as existing routes:

```
GET    /api/crm/persons?type=buyer|seller          → list persons
POST   /api/crm/persons                             → create person
GET    /api/crm/persons/[id]                        → get person + listings + events
PATCH  /api/crm/persons/[id]                        → update person
DELETE /api/crm/persons/[id]                        → soft delete (set archived=true)

POST   /api/crm/persons/[id]/listings               → associate listing
DELETE /api/crm/persons/[id]/listings/[listingId]   → remove association
PATCH  /api/crm/persons/[id]/listings/[listingId]   → update rating/notes

POST   /api/crm/persons/[id]/events                 → log interaction
GET    /api/crm/persons/[id]/matches                → matched listings for buyer

GET    /api/crm/favorites                           → get favorited agents
POST   /api/crm/favorites                           → toggle favorite

GET    /api/crm/deals                               → list deals for current agent
POST   /api/crm/deals                               → create deal
PATCH  /api/crm/deals/[id]                          → update deal (stage change auto-logs event)
GET    /api/crm/deals/[id]/events                   → deal event log
```

---

## 7. Deals View

### 7.1 Route: /dashboard/crm/deals or /dashboard/deals

Add "Deals" as a sub-section within the CRM tab (not a new bottom nav item for demo).
Access via button at top of CRM screen.

### 7.2 Implementation

```typescript
// VIEW TOGGLE: [Person View] [Property View] — pill toggle at top

// KANBAN BOARD: horizontally scrollable columns
// Each column = one stage

const DEAL_STAGES = [
  { key: 'lead',         label: { en: 'Cold Lead',    vi: 'Tiềm năng' },      color: '#475569' },
  { key: 'engaged',      label: { en: 'Engaged',      vi: 'Đã liên hệ' },     color: '#3B82F6' },
  { key: 'considering',  label: { en: 'Considering',  vi: 'Đang xem xét' },   color: '#7C3AED' },
  { key: 'viewing',      label: { en: 'Viewing',      vi: 'Xem nhà' },         color: '#CA8A04' },
  { key: 'negotiating',  label: { en: 'Negotiating',  vi: 'Thương lượng' },   color: '#E87722' },
  { key: 'closing',      label: { en: 'Closing',      vi: 'Ký hợp đồng' },    color: '#16A34A' },
  { key: 'won',          label: { en: 'Closed Won',   vi: 'Thành công' },     color: '#15803D' },
  { key: 'lost',         label: { en: 'Closed Lost',  vi: 'Không thành' },    color: '#DC2626' },
];

// COLUMN:
//   Header: colored top border + stage name + deal count badge
//   Width: 200px (fixed, horizontal scroll)
//   Height: fill screen minus nav bars

// DEAL CARD (in column):
//   Property thumbnail (small, 40x40)
//   Person name + type badge (BUYER/SELLER)
//   Price (small)
//   Days in stage (text-muted, "3 days")
//   Tap → Deal Detail bottom sheet

// DRAG TO MOVE STAGES:
//   Use @hello-pangea/dnd (fork of react-beautiful-dnd, maintained)
//   npm install @hello-pangea/dnd
//   On drop: PATCH /api/crm/deals/[id] { stage: newStage }
//   API auto-logs deal_events record for the stage change

// DEAL DETAIL (bottom sheet or full screen):
//   Person info + listing info
//   Timeline of deal_events (newest first)
//   Quick actions: "+ Log Call" | "+ Schedule Viewing" | "+ Add Note"
//   Each action opens a tiny modal: textarea + date + confirm
```

---

## 8. Profile Page — web/src/app/dashboard/profile/page.tsx

```typescript
// Ensure this exists as /dashboard/profile (not /dashboard/settings)
// Match bottom nav "My Profile" → href='/dashboard/profile'

// LAYOUT:
//   Avatar circle (large, initials, tappable to change)
//   Name (bold, large) + title/role
//   [Edit Profile] button (orange outline) + [Preview] button

// SHARED ON LISTINGS section:
//   Each contact field with orange ToggleSwitch:
//   Phone | Zalo | WhatsApp | Facebook | Instagram | Email
//   Toggle state persists in agents table (add contact_visibility JSONB column if missing)

// PRIVATE INFO section (gray header badge "🔒 Internal"):
//   Employee ID | Department | Join Date | Notes
//   Not visible to other agents

// PREVIEW MODE:
//   Shows AgentCard exactly as other agents see it in listings
//   Only toggled-on fields are shown
```

---

## 9. Docker Compose (final state for demo)

```yaml
# docker-compose.yml — Demo configuration
# Kestra and kestra-postgres are commented out

services:
  app-postgres:
    image: pgvector/pgvector:pg16
    # ... (unchanged)

  redis:
    image: redis:7-alpine
    # ... (unchanged)

  web:
    build: ./web
    ports:
      - "${WEB_PORT:-8888}:3000"
    environment:
      DATABASE_URL: postgresql://re_nhatrang:${POSTGRES_PASSWORD}@app-postgres:5432/re_nhatrang
      JWT_SECRET: ${JWT_SECRET}
      GEMINI_API_KEY: ${GEMINI_API_KEY:-}          # scaffold — empty is ok for demo
      GOOGLE_TRANSLATE_API_KEY: ${GOOGLE_TRANSLATE_API_KEY:-}  # scaffold
      UPLOADS_DIR: /app/uploads
    volumes:
      - uploads-data:/app/uploads
      - ./web:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - app-postgres
      - redis

  pgadmin:
    # ... (unchanged, useful for debugging)

  # DEMO: Kestra disabled — re-enable for MVP
  # kestra-postgres: ...
  # kestra: ...
  # kestra-restore: ...

volumes:
  postgres-data:
  uploads-data:
  # kestra-pg-data:  ← comment out too
```

---

## 10. GCP Deployment (do AFTER demo is polished)

When you're ready to deploy to GCP, follow these steps:

### Why Cloud Run (not GKE, not Compute Engine)

- Cloud Run: managed, auto-scales to zero (costs $0 when no traffic), HTTPS automatic
- Your Docker image works as-is — no Kubernetes needed
- Free tier: 2M requests/month, 360K GB-seconds compute/month

### Steps (in order)

1. **Enable APIs** in GCP Console:
   - Cloud Run API
   - Cloud SQL Admin API
   - Cloud Translation API (for translate button)
   - Artifact Registry API (for Docker images)

2. **Cloud SQL**: Create PostgreSQL 16 instance
   - Region: asia-southeast1 (Singapore, closest to Vietnam)
   - Machine: db-f1-micro ($7/mo) for demo; upgrade for production
   - DB: re_nhatrang, User: re_nhatrang, Password: strong random string
   - Enable Cloud SQL Auth Proxy for local connection

3. **Cloud Storage**: Create bucket `promemo-media`
   - Region: asia-southeast1
   - Uniform bucket-level access: ON
   - Add lifecycle rule: delete objects after 365 days (optional)
   - Use `@google-cloud/storage` npm package (S3-compatible for most operations)
   - Update upload API route to write to GCS instead of local filesystem

4. **Artifact Registry**: Push Docker image
   ```bash
   gcloud auth configure-docker asia-southeast1-docker.pkg.dev
   docker build -t asia-southeast1-docker.pkg.dev/[PROJECT]/promemo/web:latest ./web
   docker push asia-southeast1-docker.pkg.dev/[PROJECT]/promemo/web:latest
   ```

5. **Cloud Run**: Deploy
   ```bash
   gcloud run deploy promemo \
     --image asia-southeast1-docker.pkg.dev/[PROJECT]/promemo/web:latest \
     --region asia-southeast1 \
     --set-env-vars "DATABASE_URL=postgresql://..." \
     --set-env-vars "JWT_SECRET=..." \
     --add-cloudsql-instances [PROJECT]:asia-southeast1:[INSTANCE] \
     --allow-unauthenticated \
     --port 3000 \
     --memory 512Mi
   ```

6. **Custom Domain**: Map `promemo.fidt.vn` to Cloud Run URL via Cloud Console
   (add CNAME record in whatever DNS manages fidt.vn)

### BigQuery (for later)

BigQuery makes sense post-demo for:
- Cross-agent deal analytics
- Listing performance metrics (views, inquiries, time-to-close)
- Market data (price trends by ward)

Implementation: export Cloud SQL data to BigQuery via scheduled queries or Datastream.
Do NOT move your live app data to BigQuery — it stays in Cloud SQL.
BigQuery is read-only analytics on top of Cloud SQL exports.

### DuckDB (for local analytics)

Use DuckDB locally when you want to query BigQuery exports or CSV dumps
without spinning up a full DB. Not relevant for the web app itself.

---

## 11. ENV Variables Reference

```bash
# .env (copy from .env.example, never commit)

# Required for demo
POSTGRES_PASSWORD=change_me_strong_password
JWT_SECRET=64_char_random_string_here
WEB_PORT=8888

# Scaffold — empty is OK for demo, fill for MVP
GEMINI_API_KEY=
GOOGLE_TRANSLATE_API_KEY=

# GCP (fill when deploying to Cloud Run)
GCP_PROJECT_ID=
GCS_BUCKET=promemo-media
GOOGLE_APPLICATION_CREDENTIALS=/app/gcp-key.json

# pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@fidt.vn
PGADMIN_DEFAULT_PASSWORD=admin123
```

---

## 12. File Organization — New Files This Session

```
web/src/
  contexts/
    LanguageContext.tsx           ← NEW: EN/VN switcher
  lib/
    i18n.ts                       ← NEW: all translation strings
    ai-scaffold.ts                ← NEW: AI stubs (implement in MVP)
  components/
    ui/                           ← NEW directory
      StatusBadge.tsx             ← NEW
      PriceDisplay.tsx            ← NEW
      AgentChip.tsx               ← NEW
      BottomNav.tsx               ← NEW (replaces existing nav)
      TopBar.tsx                  ← NEW (replaces existing header)
      LangSwitcher.tsx            ← NEW
      ListingCard.tsx             ← NEW (replaces/supplements FeedCard)
      GridToggle.tsx              ← NEW
      TranslateButton.tsx         ← NEW
      BottomSheet.tsx             ← NEW (mobile-friendly modal)
      SearchBar.tsx               ← NEW
      FilterChip.tsx              ← NEW
  app/
    api/
      translate/route.ts          ← NEW (scaffold)
      crm/
        persons/route.ts          ← NEW
        persons/[id]/route.ts     ← NEW
        persons/[id]/listings/route.ts    ← NEW
        persons/[id]/events/route.ts      ← NEW
        persons/[id]/matches/route.ts     ← NEW
        favorites/route.ts        ← NEW
        deals/route.ts            ← NEW
        deals/[id]/route.ts       ← NEW
    dashboard/
      crm/
        page.tsx                  ← NEW (Agents|Sellers|Buyers tabs)
        persons/[id]/page.tsx     ← NEW (person detail)
        deals/page.tsx            ← NEW (kanban board)
      profile/
        page.tsx                  ← NEW or update existing

src/db/migrations/
  008_crm_schema.sql              ← NEW

scripts/
  seed_demo_users.sh              ← NEW
```

---

## 13. Testing Checklist (run through before calling it done)

### Auth
- [ ] Login as dean / demo123 → dashboard
- [ ] Login as sarah / demo123 → dashboard
- [ ] Login as minh / demo123 → dashboard
- [ ] Logout works, cookie cleared, redirect to login

### Feed
- [ ] Grid 3-col / 2-col / 1-col toggle works
- [ ] Map view toggle shows OSM map with pins
- [ ] Filter by property type filters results
- [ ] Message button opens new conversation
- [ ] "View Messages" button shows on listings with existing threads
- [ ] Owner's own listings have orange border
- [ ] Language switcher changes all nav labels

### Listings
- [ ] Add new listing form: all sections render
- [ ] Upload photo: appears in photo grid
- [ ] Publish: listing appears in feed
- [ ] Edit listing: changes saved
- [ ] Archive: listing moves to Archived tab
- [ ] Full listing view: photo carousel, specs grid, map pin

### Translate
- [ ] Translate button appears in listing description
- [ ] Without API key: shows mock message
- [ ] LangSwitcher: nav labels change language
- [ ] EN→VN: all navigation labels switch

### Inquiries
- [ ] Message Dean's listing as Sarah → thread created
- [ ] Dean sees new inquiry on his listing
- [ ] Chat: messages send and receive
- [ ] By Property grouping renders
- [ ] By Agent grouping renders

### CRM
- [ ] Agents tab: list renders, favorite toggle works
- [ ] Add Seller: form saves, appears in list
- [ ] Seller detail: shows associated listings
- [ ] Add Buyer: form saves with criteria
- [ ] Deals: kanban renders stages
- [ ] Move deal to next stage: event logged

### Mobile
- [ ] Bottom nav visible on all screens
- [ ] Top bar fixed, doesn't overlap content
- [ ] Cards are tappable (not just desktop-hover)
- [ ] Forms usable on 375px width (iPhone SE)

---

## 14. Common Pitfalls — Don't Make These Mistakes

1. **Don't clear .next cache without reason** — just wipe when routes return 404 after edits:
   `rm -rf web/.next && docker compose restart web`

2. **BIGINT from postgres = string** — always use `z.preprocess(Number, z.number())` in Zod schemas
   for price_vnd, price_per_m2, rental_income_vnd

3. **Leaflet SSR** — always dynamic import react-leaflet:
   `const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })`

4. **Tailwind v4** — if using v4, CSS variables work differently. Check which version
   is installed: `cat web/package.json | grep tailwindcss`. V4 uses @theme instead of extend.

5. **pg Pool in Next.js** — use a singleton pattern:
   ```typescript
   // lib/db.ts
   import { Pool } from 'pg';
   const globalPool = global as typeof global & { pool?: Pool };
   export const pool = globalPool.pool ?? (globalPool.pool = new Pool({ connectionString: process.env.DATABASE_URL }));
   ```

6. **httpOnly cookies in API routes** — always use `cookies()` from next/headers,
   not `req.cookies` (App Router).

7. **UUID vs INTEGER** — persons/deals use UUID, agents/parsed_listings use INTEGER.
   Don't mix them in JOIN queries.

8. **Don't rename existing API routes** — other code depends on the existing routes.
   Add new routes, don't rename.

9. **Mobile bottom nav padding** — main content needs `pb-16` (or `pb-[60px]`) to not be
   hidden under the fixed BottomNav.

10. **LanguageContext is client-only** — anything using useLanguage must be `'use client'`.
    Server components should fall back to English or accept lang as a prop.

---

## 15. Quick Commands

```bash
# Start services (Kestra commented out)
docker compose up -d

# Check which services are running
docker compose ps

# Tail web app logs
docker compose logs -f web

# Run migration 008
docker exec -i re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang \
  < src/db/migrations/008_crm_schema.sql

# Create demo users
./scripts/create_agent.sh dean "Dean Nguyen" demo123 0868331111 dean@fidt.vn
./scripts/create_agent.sh sarah "Sarah Tran" demo123 0909123456 sarah@fidt.vn
./scripts/create_agent.sh minh "Minh Le" demo123 0901234567 minh@fidt.vn

# Open psql
docker exec -it re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang

# Wipe next cache (only when routes act stale)
rm -rf web/.next

# Install new npm package
docker compose exec web npm install @hello-pangea/dnd

# Check what's in uploads
docker compose exec web ls /app/uploads/listings/
```

---

*End of CURSOR.md — commit this file to the repo root as CURSOR.md*
*Update after each session with completed items marked ✅*
