import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import { listingSchema } from "@/lib/validation";
import { generateTitleStandardized } from "@/lib/constants";
import crypto from "crypto";

const LISTING_FILTERS: {
  key: string;
  column: string;
  type: "eq" | "gte" | "lte" | "bool";
}[] = [
  { key: "property_type", column: "property_type", type: "eq" },
  { key: "transaction_type", column: "transaction_type", type: "eq" },
  { key: "ward", column: "ward", type: "eq" },
  { key: "status", column: "status", type: "eq" },
  { key: "legal_status", column: "legal_status", type: "eq" },
  { key: "direction", column: "direction", type: "eq" },
  { key: "structure_type", column: "structure_type", type: "eq" },
  { key: "access_road", column: "access_road", type: "eq" },
  { key: "furnished", column: "furnished", type: "eq" },
  { key: "building_type", column: "building_type", type: "eq" },
  { key: "price_min", column: "price_vnd", type: "gte" },
  { key: "price_max", column: "price_vnd", type: "lte" },
  { key: "area_min", column: "area_m2", type: "gte" },
  { key: "area_max", column: "area_m2", type: "lte" },
  { key: "num_bedrooms_min", column: "num_bedrooms", type: "gte" },
  { key: "corner_lot", column: "corner_lot", type: "bool" },
  { key: "has_elevator", column: "has_elevator", type: "bool" },
  { key: "negotiable", column: "negotiable", type: "bool" },
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const archived = searchParams.get("archived");
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") || "desc";

    const allowedSort = ["created_at", "updated_at", "price_vnd", "area_m2"];
    const allowedOrder = ["asc", "desc"];
    const safeSort = allowedSort.includes(sort) ? sort : "created_at";
    const safeOrder = allowedOrder.includes(order) ? order : "desc";

    const conditions: string[] = ["agent_id = $1"];
    const params: (string | number | boolean)[] = [auth.userId];
    let paramIndex = 2;

    if (archived === "true") {
      conditions.push("archived_at IS NOT NULL");
    } else if (archived === "false") {
      conditions.push("archived_at IS NULL");
    }

    for (const filter of LISTING_FILTERS) {
      const value = searchParams.get(filter.key);
      if (value === null || value === "") continue;
      if (filter.type === "eq") {
        const values = value.split(",");
        if (values.length > 1) {
          const placeholders = values.map((_, i) => `$${paramIndex + i}`).join(", ");
          conditions.push(`${filter.column} IN (${placeholders})`);
          params.push(...values);
          paramIndex += values.length;
        } else {
          conditions.push(`${filter.column} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      } else if (filter.type === "gte") {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          conditions.push(`${filter.column} >= $${paramIndex}`);
          params.push(num);
          paramIndex++;
        }
      } else if (filter.type === "lte") {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          conditions.push(`${filter.column} <= $${paramIndex}`);
          params.push(num);
          paramIndex++;
        }
      } else if (filter.type === "bool") {
        if (value === "true") conditions.push(`${filter.column} = TRUE`);
        else if (value === "false") conditions.push(`${filter.column} = FALSE`);
      }
    }

    const whereClause = conditions.join(" AND ");
    const result = await pool.query(
      `SELECT *,
        EXISTS(SELECT 1 FROM listing_favorites f WHERE f.listing_id = parsed_listings.id AND f.agent_id = $1) AS is_favorited
       FROM parsed_listings WHERE ${whereClause} ORDER BY ${safeSort} ${safeOrder}`,
      params
    );

    return NextResponse.json({ listings: result.rows });
  } catch (error) {
    console.error("Listings GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Compute listing_hash as MD5 of description
    const listingHash = data.description
      ? crypto.createHash("md5").update(data.description).digest("hex")
      : null;

    const descPrimary = data.description ?? data.description_vi ?? data.description_en ?? null;
    const result = await pool.query(
      `INSERT INTO parsed_listings (
        agent_id, listing_hash,
        property_type, transaction_type, price_raw, price_vnd,
        area_m2, address_raw, ward, street, district,
        num_bedrooms, num_floors, frontage_m, access_road, furnished,
        description, description_vi, description_en, status, freestyle_text,
        legal_status, num_bathrooms, structure_type, direction, depth_m,
        corner_lot, price_per_m2, negotiable, rental_income_vnd,
        has_elevator, nearby_amenities, investment_use_case,
        outdoor_features, special_rooms, feng_shui,
        total_construction_area, land_characteristics,
        traffic_connectivity, building_type,
        latitude, longitude,
        road_width_m, num_frontages, distance_to_beach_m,
        title_standardized, commission
      ) VALUES (
        $1, $2,
        $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21,
        $22, $23, $24, $25,
        $26, $27, $28, $29,
        $30, $31, $32,
        $33, $34,
        $35, $36,
        $37, $38,
        $39, $40,
        $41, $42, $43, $44, $45,
        $46, $47
      ) RETURNING *`,
      [
        auth.userId,
        listingHash,
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
        descPrimary,
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
        generateTitleStandardized(data),
        data.commission ?? "hh1"
      ],
    );

    return NextResponse.json({ listing: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Listings POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
