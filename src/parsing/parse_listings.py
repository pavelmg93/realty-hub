"""Orchestration module for parsing raw listings into structured data."""

import json

from sqlalchemy import text

from src.db.connection import get_engine, get_session
from src.parsing.vietnamese_parser import parse_listing


def parse_pending_listings(db_url: str, batch_id: str | None = None) -> dict[str, int]:
    """Parse all pending raw listings and store structured results.

    Reads raw_listings with status='pending', runs the Vietnamese parser,
    inserts results into parsed_listings, and updates raw_listings status.

    Args:
        db_url: PostgreSQL connection string.
        batch_id: Optional batch_id filter. If None, parses all pending.

    Returns:
        Dict with counts: {"parsed": N, "failed": N, "total": N}.
    """
    engine = get_engine(db_url)
    session = get_session(engine)

    try:
        # Fetch pending raw listings
        query = "SELECT id, message_text FROM raw_listings WHERE status = 'pending'"
        params: dict[str, str] = {}
        if batch_id:
            query += " AND batch_id = :batch_id"
            params["batch_id"] = batch_id

        rows = session.execute(text(query), params).fetchall()

        counts = {"parsed": 0, "failed": 0, "total": len(rows)}

        for row in rows:
            raw_id = row[0]
            message_text = row[1]

            try:
                parsed = parse_listing(message_text)

                # Insert parsed result
                session.execute(
                    text(
                        "INSERT INTO parsed_listings "
                        "(raw_listing_id, property_type, transaction_type, "
                        "price_raw, price_vnd, area_m2, address_raw, ward, street, "
                        "district, num_bedrooms, num_floors, frontage_m, "
                        "access_road, furnished, "
                        "legal_status, num_bathrooms, structure_type, direction, "
                        "depth_m, corner_lot, price_per_m2, negotiable, "
                        "rental_income_vnd, has_elevator, "
                        "nearby_amenities, investment_use_case, "
                        "outdoor_features, special_rooms, "
                        "feng_shui, total_construction_area, "
                        "land_characteristics, traffic_connectivity, building_type, "
                        "description, confidence, parse_errors) "
                        "VALUES (:raw_listing_id, :property_type, :transaction_type, "
                        ":price_raw, :price_vnd, :area_m2, :address_raw, :ward, :street, "
                        ":district, :num_bedrooms, :num_floors, :frontage_m, "
                        ":access_road, :furnished, "
                        ":legal_status, :num_bathrooms, :structure_type, :direction, "
                        ":depth_m, :corner_lot, :price_per_m2, :negotiable, "
                        ":rental_income_vnd, :has_elevator, "
                        ":nearby_amenities, :investment_use_case, "
                        ":outdoor_features, :special_rooms, "
                        ":feng_shui, :total_construction_area, "
                        ":land_characteristics, :traffic_connectivity, :building_type, "
                        ":description, :confidence, :parse_errors)"
                    ),
                    {
                        "raw_listing_id": raw_id,
                        "property_type": parsed.property_type,
                        "transaction_type": parsed.transaction_type,
                        "price_raw": parsed.price_raw,
                        "price_vnd": parsed.price_vnd,
                        "area_m2": parsed.area_m2,
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
                        "direction": parsed.direction,
                        "depth_m": parsed.depth_m,
                        "corner_lot": parsed.corner_lot,
                        "price_per_m2": parsed.price_per_m2,
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
                        "description": parsed.description,
                        "confidence": parsed.confidence,
                        "parse_errors": (
                            "; ".join(parsed.parse_errors) if parsed.parse_errors else None
                        ),
                    },
                )

                # Update raw listing status
                new_status = "parsed" if parsed.confidence > 0 else "failed"
                session.execute(
                    text("UPDATE raw_listings SET status = :status WHERE id = :id"),
                    {"status": new_status, "id": raw_id},
                )

                if new_status == "parsed":
                    counts["parsed"] += 1
                else:
                    counts["failed"] += 1

            except Exception as e:
                # Mark as failed and continue
                session.execute(
                    text("UPDATE raw_listings SET status = 'failed' WHERE id = :id"),
                    {"id": raw_id},
                )
                counts["failed"] += 1
                print(f"Error parsing listing {raw_id}: {e}")

        session.commit()
        return counts

    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
