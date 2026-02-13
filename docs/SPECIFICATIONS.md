# ProMemo PRD Spec
Alright, I am building an app for Real Estate Agents only, who work for this company fidt.vn, specifically their Wealth Realty department: https://fidt.vn/wealth-realty/

Goal is to allow the agents in each city/market (Nha Trang, HCMC, Hanoi, etc.) to share their sales listings with following top level statuses: open, negotiating, pending closing, sold, not for sale.

Each user, a real estate agent, has these main menu items, columns, or sections:

My Profile, Agents, Feed of Listings, My Listings.

Under My Profile they have their information and indicators for which fields get shared, plus some private info tbd.

Under Agents, all company agents are visible, filterable, searchable & sortable by name, number of listings, dates of listings, favorite-y/n, Messaged-y/n.

Under Feed of Listings there is a grid of thumbnails view w filters, search, sort, and thumbnail scale slider (three wide, two wide, single wide) at the top, Map View.

Just like on any real estate listing platform, agents can add price, photos, as well as documents (pdf, images -- ownership papers, land plot, permits, architectural drawings, etc.), property type (building, land, unit), use type (residential, commercial, industrial, mixed use), legal status (pink book, red book, etc.), full address (required=*), province*, city*, ward*, district, floor area, property area, description (freestyle, can include all info), building sub-type (free-standing house, townhouse, apartment, hotel, office suite, office bldg, retail space, retail bld, farm land, farm bldg), number of stories, garage (y, n, how many cars/bikes), parking area, access (on main road, narrow alley, wide alley, good for cars-y/n), furnished (fully, partially or not), construction status (new, renovated, fair, old, needs repair), direction it's facing (N, S, W, E, NE, SE, NW, SW), balcony-y(#)/n, elevator-y/n, rooftop, corner lot-y/n, price is firm/negotiable, motivation-high=need to sell fat/low=can wait for right price.

Their information will be added to the listing from their agent profile, based on fields and checkmarks next to each, except required full name, phone number, email, they can have Zalo, Whatsapp, facebook, instagram, more numbers, links, etc.

Once the listing is added, it becomes active and added to the Feed, where all agent's listings are visible, regardlesss of status, as long as internal status is Active and Not Archived. A button to Message the listing agent is visible to all other agents.

Pressing that button opens a new conversation thread (unique to the pair of agents and property id) on new screen.

Listings that agents have existing message threads with those listing agents have a "Vew Messages" button in place of "Message Agent" button, it is of different color.

In the feed the little card of Agent infrmation inside listing thumbnail is clickable (brings up full agent profile) and inside full listing screen as well.

Listing agent sees "View Messages" on each of his/her own listings when other agents messaged about those listings. View Messages screen present a list of threads about this property. Property filter tag is displayed at the top and can be dropped, refreshing the view to include all messages. <Filter-search/drop down menu buttons> by Agent and Property are above the list.

Those agents clicking other agent's listings' "view messages" button are presented with a single thread about this listing with the listing agent, other mechanics are same as for listing agent.

Now, please use logo and colors of the website provided and produce all required screens. Research relevant templates and best practices, functionalities. Utilize professional design language with clean aesthetic to fit the given website style.


## Data Acquisition — Web Scraping Pipeline

### Overview

In addition to manual listing creation via the ProMemo web app, we support automated
ingestion of listings from Vietnamese real estate websites using Playwright-based scrapers.
This serves two purposes:
1. **Training data** for the Vietnamese regex parser (real-world listing text)
2. **Populating ProMemo** with real listings for testing and demonstration

### Architecture

```
+----------------------------+     +----------------------------+     +----------------------------+
|     Site Scraper           |---->|     Vietnamese Parser      |---->|     PostgreSQL DB           |
|                            |     |                            |     |                            |
|   Playwright browser       |     |   Regex extraction         |     |   raw_listings +           |
|   discovers + extracts     |     |   + structured overlay     |     |   parsed_listings +        |
|   listing pages            |     |   from site JSON           |     |   listing_photos           |
+----------------------------+     +----------------------------+     +----------------------------+
```

### How to Add a New Site Scraper

1. Create `src/scraping/<sitename>.py` extending `BaseScraper`
2. Implement `discover_listing_urls(page)` -- returns list of detail page URLs
3. Implement `extract_listing(page, url)` -- returns `ScrapedListing` dataclass
4. Add the site name to the CLI choices in `src/scraping/cli.py`
5. Run: `python -m src.scraping.cli --site <sitename> --agent-phone <phone>`

### Deduplication

- `raw_listings.source_url` has a unique index -- re-running the scraper skips URLs already imported
- Photos are saved with content-hashed filenames -- identical images are stored once

### Current Scrapers

| Site | Agent | Listings | Notes |
|------|-------|----------|-------|
| batdongsannhatrang.org | Chau Loan (0901953889) | ~50+ | Extracts embedded JSON + description text |



