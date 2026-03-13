import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import { listingSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const listingId = parseInt(id, 10);
    if (isNaN(listingId)) {
      return NextResponse.json(
        { error: "Invalid listing ID" },
        { status: 400 },
      );
    }

    // Any authenticated user can view any listing (read-only)
    // Ownership is checked for PUT/DELETE only
    const result = await pool.query(
      `SELECT pl.*,
        a.username AS owner_username,
        a.first_name AS owner_first_name,
        a.phone AS owner_phone,
        a.email AS owner_email,
        (SELECT c.id FROM conversations c
         WHERE c.listing_id = pl.id
           AND ((c.agent_1_id = $2 AND c.agent_2_id = pl.agent_id)
                OR (c.agent_1_id = pl.agent_id AND c.agent_2_id = $2))
         LIMIT 1) AS existing_conversation_id
      FROM parsed_listings pl
      LEFT JOIN agents a ON a.id = pl.agent_id
      WHERE pl.id = $1`,
      [listingId, auth.userId],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ listing: result.rows[0] });
  } catch (error) {
    console.error("Listing GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const listingId = parseInt(id, 10);
    if (isNaN(listingId)) {
      return NextResponse.json(
        { error: "Invalid listing ID" },
        { status: 400 },
      );
    }

    // Verify ownership
    const existing = await pool.query(
      `SELECT agent_id FROM parsed_listings WHERE id = $1`,
      [listingId],
    );
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 },
      );
    }
    if (existing.rows[0].agent_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = listingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const result = await pool.query(
      `UPDATE parsed_listings SET
        property_type = $1, transaction_type = $2, price_raw = $3, price_vnd = $4,
        area_m2 = $5, address_raw = $6, ward = $7, street = $8, district = $9,
        num_bedrooms = $10, num_floors = $11, frontage_m = $12, access_road = $13,
        furnished = $14, description = $15, description_vi = $16, description_en = $17,
        status = $18, freestyle_text = $19,
        legal_status = $20, num_bathrooms = $21, structure_type = $22,
        direction = $23, depth_m = $24, corner_lot = $25, price_per_m2 = $26,
        negotiable = $27, rental_income_vnd = $28, has_elevator = $29,
        nearby_amenities = $30, investment_use_case = $31, outdoor_features = $32,
        special_rooms = $33, feng_shui = $34, total_construction_area = $35,
        land_characteristics = $36, traffic_connectivity = $37, building_type = $38,
        latitude = $39, longitude = $40,
        road_width_m = $41, num_frontages = $42, distance_to_beach_m = $43,
        updated_at = NOW()
      WHERE id = $44
      RETURNING *`,
      [
        data.property_type ?? null,
        data.transaction_type ?? null,
        data.price_raw ?? null,
        data.price_vnd ?? null,
        data.area_m2 ?? null,
        data.address_raw ?? null,
        data.ward ?? null,
        data.street ?? null,
        data.district ?? null,
        data.num_bedrooms ?? null,
        data.num_floors ?? null,
        data.frontage_m ?? null,
        data.access_road ?? null,
        data.furnished ?? null,
        data.description ?? data.description_vi ?? data.description_en ?? null,
        data.description_vi ?? null,
        data.description_en ?? null,
        data.status ?? "for_sale",
        data.freestyle_text ?? null,
        data.legal_status ?? null,
        data.num_bathrooms ?? null,
        data.structure_type ?? null,
        data.direction ?? null,
        data.depth_m ?? null,
        data.corner_lot ?? false,
        data.price_per_m2 ?? null,
        data.negotiable ?? false,
        data.rental_income_vnd ?? null,
        data.has_elevator ?? false,
        data.nearby_amenities ? JSON.stringify(data.nearby_amenities) : null,
        data.investment_use_case
          ? JSON.stringify(data.investment_use_case)
          : null,
        data.outdoor_features ? JSON.stringify(data.outdoor_features) : null,
        data.special_rooms ? JSON.stringify(data.special_rooms) : null,
        data.feng_shui ?? null,
        data.total_construction_area ?? null,
        data.land_characteristics ?? null,
        data.traffic_connectivity ?? null,
        data.building_type ?? null,
        data.latitude ?? null,
        data.longitude ?? null,
        data.road_width_m ?? null,
        data.num_frontages ?? null,
        data.distance_to_beach_m ?? null,
        listingId,
      ],
    );

    return NextResponse.json({ listing: result.rows[0] });
  } catch (error) {
    console.error("Listing PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const listingId = parseInt(id, 10);
    if (isNaN(listingId)) {
      return NextResponse.json(
        { error: "Invalid listing ID" },
        { status: 400 },
      );
    }

    // Verify ownership and that listing is archived
    const existing = await pool.query(
      `SELECT agent_id, archived_at FROM parsed_listings WHERE id = $1`,
      [listingId],
    );
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 },
      );
    }
    if (existing.rows[0].agent_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!existing.rows[0].archived_at) {
      return NextResponse.json(
        { error: "Listing must be archived before deletion" },
        { status: 400 },
      );
    }

    await pool.query(`DELETE FROM parsed_listings WHERE id = $1`, [listingId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Listing DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
