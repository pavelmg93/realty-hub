# SCHEMA.md — Database Schema Reference

**Source of truth for all table definitions.**
Update this file whenever a migration is applied.

**Current migration level: 012**
**Last updated: 2026-03-16 (Session 14)**

---

## Tables Overview

| Table | Purpose |
|---|---|
| `agents` | Platform users (real estate agents) |
| `raw_listings` | Raw input text before parsing |
| `parsed_listings` | Structured listing records |
| `listing_photos` | Photos attached to listings |
| `listing_documents` | Documents attached to listings |
| `listing_favorites` | Agent ↔ listing favorites (heart) |
| `agent_favorites` | Agent ↔ agent favorites (star) |
| `conversations` | Message threads between two agents on a listing |
| `messages` | Individual messages in a conversation |
| `persons` | CRM contacts — buyers and sellers |
| `person_listings` | Person ↔ listing associations |
| `deals` | Deal pipeline records |
| `deal_events` | Audit log of deal stage changes and events |
| `nha_trang_wards` | Reference: Nha Trang ward names |
| `nha_trang_streets` | Reference: Nha Trang street names |

---

## agents

Platform users. All accounts created via `scripts/create_agent.sh` — no public signup.

| Column | Type | Notes |
|---|---|---|
| `id` | integer PK | auto |
| `username` | varchar(100) | unique, used for login |
| `password_hash` | varchar(255) | bcrypt |
| `name` | varchar(255) | display name |
| `first_name` | varchar(100) | |
| `last_name` | varchar(100) | |
| `phone` | varchar(50) | |
| `email` | varchar(255) | |
| `zalo_id` | varchar(100) | future use |
| `notes` | text | |
| `created_at` | timestamp | default now() |

---

## raw_listings

Raw text input before parsing. Created when agent pastes text and hits Parse.

| Column | Type | Notes |
|---|---|---|
| `id` | integer PK | auto |
| `source` | varchar(50) | default `'zalo_manual'` |
| `source_group` | varchar(255) | |
| `sender_name` | varchar(255) | |
| `message_text` | text NOT NULL | the raw input text |
| `message_date` | timestamp | |
| `ingested_at` | timestamp | default now() |
| `batch_id` | varchar(100) | |
| `status` | varchar(20) | `pending` \| `parsed` \| `failed` \| `skipped` |
| `agent_id` | integer FK→agents | |
| `source_url` | varchar(500) | unique when not null |
| `source_listing_id` | varchar(100) | |

---

## parsed_listings

Core listing records. All listing UI reads/writes here.

| Column | Type | Notes |
|---|---|---|
| `id` | integer PK | auto |
| `raw_listing_id` | integer FK→raw_listings | nullable |
| `listing_hash` | char(32) | unique, dedup key |
| `agent_id` | integer FK→agents | owner |
| `status` | varchar(20) | see enum below, default `'for_sale'` |
| `created_at` | timestamp | default now() |
| `updated_at` | timestamp | default now() |
| `archived_at` | timestamp | set when archived |
| `freestyle_text` | text | original raw input |
| `description` | text | human-readable description |
| `title_standardized` | varchar(500) | auto-generated title (see formula below) |
| `commission` | varchar(50) | default `'hh1'` |
| **Location** | | |
| `address_raw` | varchar(500) | |
| `ward` | varchar(100) | phường/xã |
| `street` | varchar(255) | |
| `district` | varchar(100) | |
| `latitude` | double precision | |
| `longitude` | double precision | |
| **Property** | | |
| `property_type` | varchar(50) | nha_pho, can_ho, dat, villa, etc. |
| `transaction_type` | varchar(20) | ban, cho_thue |
| `price_raw` | varchar(100) | original price string |
| `price_vnd` | bigint | ⚠ returned as string by node-postgres — always parseInt() |
| `price_per_m2` | bigint | ⚠ same warning |
| `area_m2` | double precision | |
| `total_construction_area` | double precision | |
| `frontage_m` | double precision | |
| `depth_m` | double precision | |
| `road_width_m` | double precision | |
| `num_frontages` | smallint | |
| `num_floors` | smallint | |
| `num_bedrooms` | smallint | |
| `num_bathrooms` | smallint | |
| `direction` | varchar(50) | compass direction |
| `structure_type` | varchar(50) | |
| `building_type` | varchar(50) | |
| `legal_status` | varchar(50) | so_do, so_hong, etc. |
| `land_characteristics` | varchar(100) | |
| `corner_lot` | boolean | default false |
| `access_road` | varchar(255) | mat_duong, hem_oto, etc. |
| `furnished` | varchar(50) | full, co_ban, khong |
| `has_elevator` | boolean | default false |
| `negotiable` | boolean | default false |
| `rental_income_vnd` | bigint | ⚠ same warning |
| `distance_to_beach_m` | double precision | |
| `feng_shui` | varchar(50) | |
| `traffic_connectivity` | varchar(100) | |
| `nearby_amenities` | jsonb | |
| `investment_use_case` | jsonb | |
| `outdoor_features` | jsonb | |
| `special_rooms` | jsonb | |
| **Parse metadata** | | |
| `message_date` | timestamp | original listing date |
| `confidence` | double precision | default 0.0 |
| `parse_errors` | text | |
| `parsed_at` | timestamp | default now() |

### status enum

```
just_listed | for_sale | price_dropped | price_increased |
deposit | sold | not_for_sale
```

Display order: Just Listed → For Sale → Price Dropped → Price Increased → Deposit → Sold → Not for Sale

"For Sale" is the default and is **not shown as a badge** on thumbnails.

### title_standardized formula

```
<address> <area_m2> <num_floors> <frontage_m>x<depth_m> <price-short> <commission>
```

Example: `34/2 Nguyen Thien Thuat 100 7 10x10 20ty hh1`

---

## listing_photos

| Column | Type | Notes |
|---|---|---|
| `id` | integer PK | auto |
| `listing_id` | integer FK→parsed_listings | CASCADE delete |
| `file_path` | varchar(500) NOT NULL | relative path under `uploads/listings/<id>/` |
| `original_name` | varchar(255) | |
| `file_size` | integer | bytes |
| `display_order` | smallint | default 0 |
| `created_at` | timestamp | default now() |

---

## listing_favorites

Agent hearts a listing. Toggle on/off.

| Column | Type | Notes |
|---|---|---|
| `agent_id` | integer FK→agents | CASCADE delete — composite PK |
| `listing_id` | integer FK→parsed_listings | CASCADE delete — composite PK |
| `created_at` | timestamp | default now() |

---

## agent_favorites

Agent stars another agent (follow/bookmark).

| Column | Type | Notes |
|---|---|---|
| `agent_id` | integer FK→agents | CASCADE delete — composite PK |
| `favorited_agent_id` | integer FK→agents | CASCADE delete — composite PK |
| `created_at` | timestamp with time zone | |

---

## conversations

One thread per agent-pair per listing. `agent_1_id` always < `agent_2_id` (enforced by CHECK).

| Column | Type | Notes |
|---|---|---|
| `id` | integer PK | auto |
| `agent_1_id` | integer FK→agents NOT NULL | lower id |
| `agent_2_id` | integer FK→agents NOT NULL | higher id |
| `listing_id` | integer FK→parsed_listings NOT NULL | |
| `created_at` | timestamp | default now() |
| `updated_at` | timestamp | default now() |

Unique constraint: `(agent_1_id, agent_2_id, listing_id)`

---

## messages

| Column | Type | Notes |
|---|---|---|
| `id` | integer PK | auto |
| `conversation_id` | integer FK→conversations NOT NULL | |
| `sender_id` | integer FK→agents NOT NULL | |
| `body` | text NOT NULL | |
| `listing_id` | integer FK→parsed_listings | optional context |
| `created_at` | timestamp | default now() |
| `read_at` | timestamp | null = unread |

---

## persons

CRM contacts — buyers and sellers. Created by agents, not system users.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | gen_random_uuid() |
| `type` | varchar(10) NOT NULL | `buyer` \| `seller` |
| `full_name` | varchar(200) NOT NULL | |
| `phone` | varchar(30) | |
| `zalo` | varchar(100) | |
| `email` | varchar(200) | |
| `notes` | text | |
| `status` | varchar(30) NOT NULL | see deal stages enum, default `'lead'` |
| `buyer_criteria` | jsonb | budget, area, location preferences |
| `created_by_agent_id` | integer FK→agents | |
| `created_at` | timestamp with time zone | |
| `updated_at` | timestamp with time zone | |

---

## person_listings

Associates a person (buyer/seller) with a listing.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `person_id` | uuid FK→persons | CASCADE delete |
| `listing_id` | integer FK→parsed_listings | CASCADE delete |
| `role` | varchar(20) NOT NULL | `buyer_interest` \| `seller` \| `co_agent` |
| `rating` | smallint | 1–5 |
| `notes` | text | |
| `created_at` | timestamp with time zone | |

Unique: `(person_id, listing_id, role)`

---

## deals

Deal pipeline record. Links a buyer, seller, listing, and managing agent.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `listing_id` | integer FK→parsed_listings | SET NULL on delete |
| `buyer_person_id` | uuid FK→persons | SET NULL on delete |
| `seller_person_id` | uuid FK→persons | SET NULL on delete |
| `agent_id` | integer FK→agents | SET NULL on delete |
| `stage` | varchar(30) NOT NULL | see enum below, default `'lead'` |
| `stage_updated_at` | timestamp with time zone | |
| `value_vnd` | bigint | |
| `notes` | text | |
| `closed_at` | timestamp with time zone | |
| `created_at` | timestamp with time zone | |
| `updated_at` | timestamp with time zone | |

### deal stage enum

```
lead → engaged → considering → viewing → negotiating → closing → won | lost
```

---

## deal_events

Audit log for deals — every stage change, note, call, viewing, offer, etc.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `deal_id` | uuid FK→deals | CASCADE delete |
| `event_type` | varchar(40) NOT NULL | `stage_change` \| `note` \| `call` \| `viewing` \| `offer` \| `contract` \| `close` \| `other` |
| `from_stage` | varchar(30) | |
| `to_stage` | varchar(30) | |
| `notes` | text | |
| `created_by_agent_id` | integer FK→agents | SET NULL on delete |
| `created_at` | timestamp with time zone | |

---

## Reference Tables

### nha_trang_wards
28 entries: 20 phường + 8 xã (pre/post-merger names included).

### nha_trang_streets
60 street entries for Nha Trang city.

---

## Key Notes for Developers

1. **BIGINT as string** — `price_vnd`, `price_per_m2`, `rental_income_vnd` are returned as strings by node-postgres. Always coerce: `parseInt(row.price_vnd) || null`

2. **UUID vs integer PKs** — `persons`, `deals`, `deal_events`, `person_listings` use UUID. `agents`, `parsed_listings`, `conversations`, `messages` use integer. Do not mix them up in JOIN queries.

3. **Conversation ordering** — `agent_1_id` is always the lower integer. When creating a conversation, sort the two agent IDs before inserting.

4. **Status constraints** — Single CHECK constraint (`parsed_listings_status_check`). Valid values: `just_listed`, `for_sale`, `price_dropped`, `price_increased`, `deposit`, `sold`, `not_for_sale`. Reduced from 9 to 7 in migration 012.

5. **Migrations location** — `src/db/migrations/002` through `012`. Run in order after a fresh `docker compose down -v && up -d`.

6. **avatar_url NOT in DB** — Migration 010 defines `avatar_url` on agents, but it was never applied to the production/demo DB. Code handles this gracefully (shows initials avatar). Do not reference `agents.avatar_url` in SQL queries until the migration is applied.
