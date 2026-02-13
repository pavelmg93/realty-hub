"""Abstract base class for site-specific web scrapers."""

import asyncio
import hashlib
import json
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path

import httpx
from playwright.async_api import Page, async_playwright
from sqlalchemy import text

from src.db.connection import get_engine, get_session
from src.parsing.vietnamese_parser import parse_listing
from src.scraping.photo_downloader import download_photo


@dataclass
class ScrapedListing:
    """Data extracted from a single listing page."""

    source_url: str
    source_listing_id: str
    title: str
    description_text: str
    price_vnd: int | None = None
    area_m2: float | None = None
    direction: str | None = None
    road_width_m: float | None = None
    num_frontages: int | None = None
    distance_to_beach_m: float | None = None
    photo_urls: list[str] = field(default_factory=list)
    contact_name: str | None = None
    contact_phone: str | None = None
    structured_attrs: dict = field(default_factory=dict)


class BaseScraper(ABC):
    """Abstract base for site-specific scrapers.

    Subclasses implement `discover_listing_urls` and `extract_listing`.
    The base class handles DB insertion, photo downloading, and dedup.
    """

    SOURCE_NAME: str = "unknown"

    def __init__(
        self,
        db_url: str,
        uploads_dir: Path,
        agent_id: int,
        headless: bool = True,
    ) -> None:
        self.db_url = db_url
        self.uploads_dir = uploads_dir
        self.agent_id = agent_id
        self.headless = headless
        self.engine = get_engine(db_url)

    # --- Subclass interface ---

    @abstractmethod
    async def discover_listing_urls(self, page: Page) -> list[str]:
        """Return a list of listing detail page URLs to scrape."""

    @abstractmethod
    async def extract_listing(self, page: Page, url: str) -> ScrapedListing | None:
        """Navigate to a listing page and extract structured data."""

    # --- Main run loop ---

    async def run(self, max_listings: int = 0) -> dict[str, int]:
        """Execute the full scraping pipeline.

        Args:
            max_listings: Maximum number of listings to scrape. 0 = unlimited.

        Returns:
            Dict with counts: scraped, skipped (dupes), failed, photos.
        """
        counts = {"scraped": 0, "skipped": 0, "failed": 0, "photos": 0}

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=self.headless)
            page = await browser.new_page()

            print(f"[{self.SOURCE_NAME}] Discovering listing URLs...")
            urls = await self.discover_listing_urls(page)
            print(f"[{self.SOURCE_NAME}] Found {len(urls)} listing URLs")

            if max_listings > 0:
                urls = urls[:max_listings]

            async with httpx.AsyncClient() as http_client:
                for i, url in enumerate(urls, 1):
                    print(f"\n[{i}/{len(urls)}] {url}")

                    if self.is_duplicate(url):
                        print("  -> Skipped (already imported)")
                        counts["skipped"] += 1
                        continue

                    try:
                        listing = await self.extract_listing(page, url)
                        if listing is None:
                            print("  -> Skipped (extraction returned None)")
                            counts["failed"] += 1
                            continue

                        raw_id, parsed_id = self.insert_listing(listing)
                        print(f"  -> raw_id={raw_id}, parsed_id={parsed_id}")

                        # Download photos
                        photo_dir = self.uploads_dir / "listings" / str(parsed_id)
                        for order, photo_url in enumerate(listing.photo_urls):
                            result = await download_photo(
                                http_client, photo_url, photo_dir
                            )
                            if result:
                                file_path, file_size = result
                                self.register_photo(
                                    parsed_id,
                                    file_path,
                                    photo_url.rsplit("/", 1)[-1],
                                    file_size,
                                    order,
                                )
                                counts["photos"] += 1

                        counts["scraped"] += 1

                        # Polite delay between requests
                        await asyncio.sleep(1.5)

                    except Exception as exc:
                        print(f"  -> FAILED: {exc}")
                        counts["failed"] += 1
                        continue

            await browser.close()

        print(f"\n[{self.SOURCE_NAME}] Done: {counts}")
        return counts

    # --- Database helpers ---

    def is_duplicate(self, source_url: str) -> bool:
        """Check if a listing URL has already been imported."""
        session = get_session(self.engine)
        try:
            result = session.execute(
                text("SELECT 1 FROM raw_listings WHERE source_url = :url"),
                {"url": source_url},
            )
            return result.fetchone() is not None
        finally:
            session.close()

    def insert_listing(self, listing: ScrapedListing) -> tuple[int, int]:
        """Insert a scraped listing into raw_listings + parsed_listings.

        Returns:
            Tuple of (raw_listing_id, parsed_listing_id).
        """
        session = get_session(self.engine)
        try:
            # 1. Insert into raw_listings
            raw_result = session.execute(
                text(
                    "INSERT INTO raw_listings "
                    "(source, message_text, status, source_url, source_listing_id, "
                    " sender_name, agent_id) "
                    "VALUES (:source, :text, 'parsed', :url, :sid, :sender, :agent_id) "
                    "RETURNING id"
                ),
                {
                    "source": self.SOURCE_NAME,
                    "text": listing.description_text,
                    "url": listing.source_url,
                    "sid": listing.source_listing_id,
                    "sender": listing.contact_name,
                    "agent_id": self.agent_id,
                },
            )
            raw_id = raw_result.fetchone()[0]

            # 2. Run Vietnamese parser on the description text
            parsed = parse_listing(listing.description_text)

            # 3. Overlay structured JSON data (site data wins where available)
            price_vnd = listing.price_vnd or parsed.price_vnd
            area_m2 = listing.area_m2 or parsed.area_m2
            direction = listing.direction or parsed.direction
            road_width_m = listing.road_width_m or parsed.road_width_m
            num_frontages = listing.num_frontages or parsed.num_frontages
            distance_to_beach_m = (
                listing.distance_to_beach_m or parsed.distance_to_beach_m
            )

            # Compute listing hash from description
            listing_hash = hashlib.md5(
                listing.description_text.encode()
            ).hexdigest()

            # Compute price_per_m2 if not available from parser
            price_per_m2 = parsed.price_per_m2
            if not price_per_m2 and price_vnd and area_m2:
                price_per_m2 = int(price_vnd / area_m2)

            # 4. Insert into parsed_listings
            parsed_result = session.execute(
                text(
                    "INSERT INTO parsed_listings "
                    "(raw_listing_id, listing_hash, agent_id, "
                    " property_type, transaction_type, price_raw, price_vnd, "
                    " area_m2, address_raw, ward, street, district, "
                    " num_bedrooms, num_floors, frontage_m, access_road, furnished, "
                    " legal_status, num_bathrooms, structure_type, direction, "
                    " depth_m, corner_lot, price_per_m2, negotiable, "
                    " rental_income_vnd, has_elevator, "
                    " nearby_amenities, investment_use_case, "
                    " outdoor_features, special_rooms, "
                    " feng_shui, total_construction_area, "
                    " land_characteristics, traffic_connectivity, building_type, "
                    " road_width_m, num_frontages, distance_to_beach_m, "
                    " description, confidence, parse_errors, status) "
                    "VALUES "
                    "(:raw_id, :hash, :agent_id, "
                    " :property_type, :transaction_type, :price_raw, :price_vnd, "
                    " :area_m2, :address_raw, :ward, :street, :district, "
                    " :num_bedrooms, :num_floors, :frontage_m, :access_road, :furnished, "
                    " :legal_status, :num_bathrooms, :structure_type, :direction, "
                    " :depth_m, :corner_lot, :price_per_m2, :negotiable, "
                    " :rental_income_vnd, :has_elevator, "
                    " :nearby_amenities, :investment_use_case, "
                    " :outdoor_features, :special_rooms, "
                    " :feng_shui, :total_construction_area, "
                    " :land_characteristics, :traffic_connectivity, :building_type, "
                    " :road_width_m, :num_frontages, :distance_to_beach_m, "
                    " :description, :confidence, :parse_errors, 'for_sale') "
                    "RETURNING id"
                ),
                {
                    "raw_id": raw_id,
                    "hash": listing_hash,
                    "agent_id": self.agent_id,
                    "property_type": parsed.property_type,
                    "transaction_type": parsed.transaction_type,
                    "price_raw": parsed.price_raw,
                    "price_vnd": price_vnd,
                    "area_m2": area_m2,
                    "address_raw": parsed.address_raw,
                    "ward": parsed.ward,
                    "street": parsed.street,
                    "district": parsed.district,
                    "num_bedrooms": parsed.num_bedrooms,
                    "num_floors": parsed.num_floors,
                    "frontage_m": parsed.frontage_m,
                    "access_road": parsed.access_road,
                    "furnished": parsed.furnished,
                    "legal_status": parsed.legal_status,
                    "num_bathrooms": parsed.num_bathrooms,
                    "structure_type": parsed.structure_type,
                    "direction": direction,
                    "depth_m": parsed.depth_m,
                    "corner_lot": parsed.corner_lot,
                    "price_per_m2": price_per_m2,
                    "negotiable": parsed.negotiable,
                    "rental_income_vnd": parsed.rental_income_vnd,
                    "has_elevator": parsed.has_elevator,
                    "nearby_amenities": (
                        json.dumps(parsed.nearby_amenities)
                        if parsed.nearby_amenities
                        else None
                    ),
                    "investment_use_case": (
                        json.dumps(parsed.investment_use_case)
                        if parsed.investment_use_case
                        else None
                    ),
                    "outdoor_features": (
                        json.dumps(parsed.outdoor_features)
                        if parsed.outdoor_features
                        else None
                    ),
                    "special_rooms": (
                        json.dumps(parsed.special_rooms)
                        if parsed.special_rooms
                        else None
                    ),
                    "feng_shui": parsed.feng_shui,
                    "total_construction_area": parsed.total_construction_area,
                    "land_characteristics": parsed.land_characteristics,
                    "traffic_connectivity": parsed.traffic_connectivity,
                    "building_type": parsed.building_type,
                    "road_width_m": road_width_m,
                    "num_frontages": num_frontages,
                    "distance_to_beach_m": distance_to_beach_m,
                    "description": parsed.description,
                    "confidence": parsed.confidence,
                    "parse_errors": (
                        "; ".join(parsed.parse_errors) if parsed.parse_errors else None
                    ),
                },
            )
            parsed_id = parsed_result.fetchone()[0]

            session.commit()
            return raw_id, parsed_id

        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def register_photo(
        self,
        listing_id: int,
        file_path: str,
        original_name: str,
        file_size: int,
        display_order: int = 0,
    ) -> None:
        """Register a downloaded photo in the listing_photos table."""
        session = get_session(self.engine)
        try:
            session.execute(
                text(
                    "INSERT INTO listing_photos "
                    "(listing_id, file_path, original_name, file_size, display_order) "
                    "VALUES (:lid, :path, :name, :size, :order)"
                ),
                {
                    "lid": listing_id,
                    "path": file_path,
                    "name": original_name,
                    "size": file_size,
                    "order": display_order,
                },
            )
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
