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

    const result = await pool.query(
      `SELECT * FROM parsed_listings WHERE id = $1`,
      [listingId],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 },
      );
    }

    const listing = result.rows[0];
    if (listing.agent_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ listing });
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
        furnished = $14, description = $15, status = $16, freestyle_text = $17,
        legal_status = $18, num_bathrooms = $19, structure_type = $20,
        direction = $21, depth_m = $22, corner_lot = $23, price_per_m2 = $24,
        negotiable = $25, rental_income_vnd = $26, has_elevator = $27,
        nearby_amenities = $28, investment_use_case = $29, outdoor_features = $30,
        special_rooms = $31, feng_shui = $32, total_construction_area = $33,
        land_characteristics = $34, traffic_connectivity = $35, building_type = $36,
        updated_at = NOW()
      WHERE id = $37
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
        data.description ?? null,
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
