## Session 13 — 2026-03-15 — Google Cloud VM Deployment, Docker Fixes, DB Schema Alignment

### Summary

Migrated the application from the local **WSL Ubuntu development environment** to a **Google Cloud VM** and stabilized the runtime stack. The work focused on Docker container reliability, Python runtime availability for the parser, and resolving several PostgreSQL schema mismatches that caused API failures.

The application is now running successfully on the VM with Docker Compose, Next.js, and PostgreSQL connectivity functioning correctly. This prepares the repository for the next development phase, which will be executed by AntiGravity.

### Infrastructure Work

- Pulled repository onto Google Cloud VM and confirmed Git workflow.
- Verified push / pull cycle between local machine and VM.
- Confirmed when Docker containers require restart vs rebuild.
- Validated server logs from inside container for debugging.

### Docker Fixes

Resolved parser failure:

`spawn python3 ENOENT`

Root cause:
Python runtime was missing inside the **web container**.

Actions:

- Updated Dockerfile to install Python inside container.
- Corrected dependency installation method (base image did not support `apt-get`).
- Rebuilt containers with:

```
docker compose build
docker compose up -d
```

- Verified container shell access using `sh` (not `bash`).

### Backend / Database Fixes

**Listings Insert Error**

Error:

`INSERT has more expressions than target columns`

Cause:
Mismatch between SQL column list and values.

Fix:
Aligned `INSERT INTO parsed_listings` column list with value array.

---

**Agent Profile API Error**

Error:

`column "avatar_url" does not exist`

Cause:
API expected schema field not present in DB.

Fix:
Adjusted query in `/api/agents/[id]` to match actual `agents` table schema.

### Operational Observations

Key lessons for the project:

- Docker images must be **rebuilt** after Dockerfile dependency changes.
- Running application logs **inside containers** is essential for debugging.
- When multiple AI agents modify code, **database schema drift** becomes likely and must be verified early.

### Current System Status

Working components:

- Next.js server running in Docker
- PostgreSQL queries functioning
- API routes returning valid responses
- GitHub deployment workflow operational
- Application reachable on Google Cloud VM

Remaining work is primarily **feature development and UI reconstruction**, not infrastructure.

---

### TODO — Next Development Phase

1. **Rebuild New Listing Form**

Inspired by Stitch mockup:

```
./stitch_property_details_view/add_new_listing_form
```

Requirements:

- Follow **raw_listings schema exactly**
- Add **Description block** with:

Parse button:
- creates row in `raw_listings`
- runs Python parser
- calls **Gemini API**
- extracts structured fields
- prefills form fields
- stages row in `parsed_listings`

Create Listing button:
- inserts final row into `parsed_listings`

2. **Confirm Schema Consistency**

Verify identical schema usage across:

Feed page:
- full `parsed_listings` schema

My Listings:
- same schema
- Agent defaults to current user

New Listing:
- same schema fields

3. **Rebuild My Listings Page**

Match Stitch design:

```
./stitch_property_details_view/my_listings_management
```

4. **Favorites on Feed**

- Add favorite icon button to listing thumbnails
- Persist favorites in database
- Add favorites filter to Feed

5. **Title_Standardized Field**

Add field to `parsed_listings`.

Format:

```
<Address> <area> <#floors> <frontage>x<depth> <#bedrooms>/<#bathrooms> <price-shortest-format> <commission-code>
```

Example:

```
34/2 Nguyen Thien Thuat 100 7 10x10 15/15 20ty hh1
```

Also add:

`commission` field (string)

default:

`hh1`

6. **Listing Status Enhancements**

Add computed statuses:

- Price Raised
- Price Dropped
- Newest

7. **Vietnamese UI Pass**

After functional work stabilizes:

- audit entire UI
- rerun translations
- confirm consistent Vietnamese terminology across pages
