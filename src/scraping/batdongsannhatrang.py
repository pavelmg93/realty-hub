"""Scraper for batdongsannhatrang.org — Châu Loan's property site."""

import re

from playwright.async_api import Page

from src.scraping.base_scraper import BaseScraper, ScrapedListing


def _parse_vnd_price(raw: str) -> int | None:
    """Parse a Vietnamese price string into VND integer.

    Handles formats like "3.500.000.000", "3,5 tỷ", "350 triệu".
    """
    if not raw:
        return None
    raw = raw.strip().replace(" ", "")

    # Try "X tỷ" or "X triệu" formats
    m = re.search(r"([\d.,]+)\s*(?:tỷ|ty|tỉ|ti)", raw, re.IGNORECASE)
    if m:
        num = float(m.group(1).replace(".", "").replace(",", "."))
        return int(num * 1_000_000_000)

    m = re.search(r"([\d.,]+)\s*(?:triệu|trieu|tr)", raw, re.IGNORECASE)
    if m:
        num = float(m.group(1).replace(".", "").replace(",", "."))
        return int(num * 1_000_000)

    # Try raw numeric (already in VND, e.g. "3500000000")
    digits = raw.replace(".", "").replace(",", "")
    if digits.isdigit() and len(digits) >= 6:
        return int(digits)

    return None


def _parse_area(raw: str) -> float | None:
    """Parse area string like '59,3 m2' -> 59.3."""
    if not raw:
        return None
    m = re.search(r"([\d.,]+)\s*m", raw, re.IGNORECASE)
    if m:
        return float(m.group(1).replace(",", "."))
    return None


def _parse_road_width(raw: str) -> float | None:
    """Parse road width string like '20m' -> 20.0."""
    if not raw:
        return None
    m = re.search(r"([\d.,]+)\s*m", raw, re.IGNORECASE)
    if m:
        return float(m.group(1).replace(",", "."))
    return None


def _parse_direction(raw: str) -> str | None:
    """Map Vietnamese direction string to canonical code.

    'Hướng Đông Nam' -> 'dong_nam', etc.
    """
    if not raw:
        return None
    raw_lower = raw.lower().strip()

    direction_map = {
        "đông nam": "dong_nam",
        "tây nam": "tay_nam",
        "đông bắc": "dong_bac",
        "tây bắc": "tay_bac",
        "đông": "dong",
        "tây": "tay",
        "nam": "nam",
        "bắc": "bac",
    }
    # Remove "hướng" prefix
    cleaned = re.sub(r"^hướng\s*", "", raw_lower)
    return direction_map.get(cleaned)


class BatDongSanNhaTrangScraper(BaseScraper):
    """Scraper for batdongsannhatrang.org."""

    BASE_URL = "https://batdongsannhatrang.org"
    SOURCE_NAME = "batdongsannhatrang.org"

    # Category pages to crawl for listing links
    CATEGORY_PATHS = [
        "/nha-dat-nha-trang",
    ]

    async def discover_listing_urls(self, page: Page) -> list[str]:
        """Discover listing URLs from category pages and pagination.

        Strategy:
        1. Visit each category page
        2. Extract all .item links
        3. Follow pagination ("Load more" or page links)
        4. Deduplicate across categories
        """
        urls: set[str] = set()

        for cat_path in self.CATEGORY_PATHS:
            cat_url = f"{self.BASE_URL}{cat_path}"
            print(f"  Crawling category: {cat_url}")

            try:
                await page.goto(cat_url, wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(2000)

                # Scroll to trigger any lazy loading
                for _ in range(5):
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await page.wait_for_timeout(1000)

                # Extract listing links — look for common listing link patterns
                links = await page.evaluate(
                    """() => {
                    const results = [];
                    const sel = '.item a, .product-item a, '
                        + 'article a, .listing-item a';
                    const items = document.querySelectorAll(sel);
                    for (const a of items) {
                        if (a.href && a.href.includes('/p/'))
                            results.push(a.href);
                    }
                    if (results.length === 0) {
                        const all = document.querySelectorAll(
                            'a[href*="/p/"]');
                        for (const a of all) results.push(a.href);
                    }
                    return [...new Set(results)];
                    }"""
                )

                for link in links:
                    if link.startswith(self.BASE_URL):
                        urls.add(link)
                    elif link.startswith("/"):
                        urls.add(f"{self.BASE_URL}{link}")

                print(f"    Found {len(links)} links on {cat_path}")

                # Check for pagination and follow additional pages
                page_num = 2
                while True:
                    paginated_url = f"{cat_url}?page={page_num}"
                    try:
                        resp = await page.goto(
                            paginated_url, wait_until="domcontentloaded", timeout=15000
                        )
                        if resp and resp.status >= 400:
                            break

                        await page.wait_for_timeout(1500)

                        more_links = await page.evaluate(
                            """() => {
                            const results = [];
                            const sel = '.item a, .product-item a, '
                                + 'article a, .listing-item a';
                            const items = document.querySelectorAll(sel);
                            for (const a of items) {
                                if (a.href && a.href.includes('/p/'))
                                    results.push(a.href);
                            }
                            if (results.length === 0) {
                                const all = document.querySelectorAll(
                                    'a[href*="/p/"]');
                                for (const a of all)
                                    results.push(a.href);
                            }
                            return [...new Set(results)];
                            }"""
                        )

                        if not more_links:
                            break

                        new_count = 0
                        for link in more_links:
                            full = link if link.startswith("http") else f"{self.BASE_URL}{link}"
                            if full not in urls:
                                urls.add(full)
                                new_count += 1

                        print(f"    Page {page_num}: {new_count} new links")
                        if new_count == 0:
                            break

                        page_num += 1

                    except Exception:
                        break

            except Exception as exc:
                print(f"    Error crawling {cat_url}: {exc}")

        return sorted(urls)

    async def extract_listing(self, page: Page, url: str) -> ScrapedListing | None:
        """Extract listing data from a detail page.

        Extracts the embedded JSON from `languageText.jsonProductIndex`
        plus the human-readable description text.
        """
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(2000)
        except Exception as exc:
            print(f"  Navigation error: {exc}")
            return None

        # 1. Extract the embedded JSON from languageText.jsonProductIndex
        json_data = await page.evaluate("""
            () => {
                try {
                    if (typeof languageText !== 'undefined' && languageText.jsonProductIndex) {
                        return languageText.jsonProductIndex;
                    }
                } catch(e) {}
                return null;
            }
        """)

        if not json_data:
            # Fallback: try to find it in script tags
            json_data = await page.evaluate(
                """() => {
                const scripts = document.querySelectorAll('script');
                for (const s of scripts) {
                    const t = s.textContent || '';
                    const re = /jsonProductIndex\\s*=\\s*/;
                    const idx = t.search(re);
                    if (idx < 0) continue;
                    const sub = t.slice(idx);
                    const m = sub.match(
                        /=\\s*(\\{[\\s\\S]*?\\})\\s*;/);
                    if (m) {
                        try { return JSON.parse(m[1]); }
                        catch(e) {}
                    }
                }
                return null;
                }"""
            )

        # 2. Extract the description text from the page
        description = await page.evaluate(
            """() => {
            const sels = [
                '.product-detail-layout .info',
                '.product-detail .info',
                '.detail-content',
                '.product-description',
                '.entry-content',
                'article .content',
            ];
            for (const sel of sels) {
                const el = document.querySelector(sel);
                if (el && el.textContent.trim().length > 20)
                    return el.textContent.trim();
            }
            const main = document.querySelector('main')
                || document.querySelector('.main-content');
            if (main)
                return main.textContent.trim().substring(0, 5000);
            return '';
            }"""
        )

        # Compute source listing ID early (needed for photo filtering)
        source_listing_id = self._extract_id_from_url(url)

        # 3. Extract photo URLs — filter to this listing's own photos
        #    The site stores listing photos as product/{id}_{n}.jpg
        #    Without filtering, [data-img] grabs sidebar/related listing thumbnails too
        #    JS lazy-loading may consume data-img into src, so check both attributes
        photo_urls = await page.evaluate(
            """(listingId) => {
            const photos = new Set();
            const idPat = 'product/' + listingId + '_';

            // Check ALL img elements for any attribute matching our listing ID
            const allImgs = document.querySelectorAll('img');
            for (const img of allImgs) {
                for (const attr of ['data-img', 'data-src', 'src']) {
                    const val = img.getAttribute(attr);
                    if (val && val.includes(idPat))
                        photos.add(val);
                }
            }

            // Also check non-img elements with data-img (e.g. div backgrounds)
            const dataImgs = document.querySelectorAll('[data-img]');
            for (const el of dataImgs) {
                const val = el.getAttribute('data-img');
                if (val && val.includes(idPat))
                    photos.add(val);
            }

            return [...photos];
            }""",
            source_listing_id,
        )

        # Normalize photo URLs to absolute and deduplicate
        seen: set[str] = set()
        normalized_photos: list[str] = []
        for p in photo_urls:
            if p.startswith("//"):
                p = "https:" + p
            elif p.startswith("/"):
                p = f"{self.BASE_URL}{p}"
            elif not p.startswith("http"):
                p = f"{self.BASE_URL}/{p}"
            if p not in seen:
                seen.add(p)
                normalized_photos.append(p)

        # 4. Extract title
        title = await page.evaluate("""
            () => {
                const h1 = document.querySelector('h1');
                return h1 ? h1.textContent.trim() : '';
            }
        """)

        # 5. Build ScrapedListing from JSON data + page content
        # Parse structured JSON attributes if available
        price_vnd = None
        area_m2 = None
        direction = None
        road_width_m = None
        contact_name = None
        contact_phone = None
        structured_attrs: dict = {}

        if json_data and isinstance(json_data, dict):
            structured_attrs = json_data

            # pr.sale -> price
            pr = json_data.get("pr", {})
            if isinstance(pr, dict):
                price_raw = pr.get("sale") or pr.get("price") or pr.get("s")
                if price_raw:
                    price_vnd = _parse_vnd_price(str(price_raw))

            # attr.a -> area, attr.d -> direction, attr.s -> road width
            attr = json_data.get("attr", {})
            if isinstance(attr, dict):
                area_raw = attr.get("a") or attr.get("area")
                if area_raw:
                    area_m2 = _parse_area(str(area_raw))

                dir_raw = attr.get("d") or attr.get("direction")
                if dir_raw:
                    direction = _parse_direction(str(dir_raw))

                road_raw = attr.get("s") or attr.get("street_width")
                if road_raw:
                    road_width_m = _parse_road_width(str(road_raw))

            # Contact info
            contact_name = json_data.get("contact_name") or json_data.get("cn")
            contact_phone = json_data.get("contact_phone") or json_data.get("cp")

        # Build the full description text for parsing: title + description
        full_text = f"{title}\n\n{description}" if title else description

        if not full_text or len(full_text.strip()) < 10:
            print("  -> No meaningful text content found")
            return None

        return ScrapedListing(
            source_url=url,
            source_listing_id=source_listing_id,
            title=title or "Untitled",
            description_text=full_text,
            price_vnd=price_vnd,
            area_m2=area_m2,
            direction=direction,
            road_width_m=road_width_m,
            photo_urls=normalized_photos,
            contact_name=contact_name,
            contact_phone=contact_phone,
            structured_attrs=structured_attrs,
        )

    @staticmethod
    def _extract_id_from_url(url: str) -> str:
        """Extract the listing ID from a URL like '/p/some-slug.169'."""
        # Pattern: .NNN at end of URL path
        m = re.search(r"\.(\d+)(?:\?|$)", url)
        if m:
            return m.group(1)
        # Fallback: use the last path segment
        path = url.rstrip("/").rsplit("/", 1)[-1]
        return path
