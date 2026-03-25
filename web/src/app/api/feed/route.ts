import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

/** Auto-revert just_listed → selling after 7 days (read-time check) */
function resolveStatus(status: string, createdAt: Date | string): string {
  if (status === "just_listed") {
    const age = Date.now() - new Date(createdAt).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (age > sevenDays) return "selling";
  }
  return status;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const offset = (page - 1) * limit;

    // Sorting
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") || "desc";
    const allowedSort = ["created_at", "updated_at", "price_vnd", "area_m2"];
    const allowedOrder = ["asc", "desc"];
    const safeSort = allowedSort.includes(sort) ? sort : "created_at";
    const safeOrder = allowedOrder.includes(order) ? order : "desc";

    // Full-text search
    const q = searchParams.get("q")?.trim() || "";

    // Build dynamic WHERE clauses
    const conditions: string[] = ["pl.archived_at IS NULL"];
    const params: (string | number | boolean)[] = [];
    let paramIndex = 1;

    if (q) {
      conditions.push(`pl.search_vector @@ to_tsquery('simple', unaccent($${paramIndex}))`);
      // Convert search term to tsquery format (prefix match, handle spaces)
      const tsQuery = q
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w + ":*")
        .join(" & ");
      params.push(tsQuery);
      paramIndex++;
    }

    // Filter parameters
    const filters: {
      key: string;
      column: string;
      type: "eq" | "gte" | "lte" | "bool";
    }[] = [
      { key: "city", column: "pl.city", type: "eq" },
      { key: "property_type", column: "pl.property_type", type: "eq" },
      { key: "transaction_type", column: "pl.transaction_type", type: "eq" },
      { key: "ward", column: "pl.ward", type: "eq" },
      { key: "status", column: "pl.status", type: "eq" },
      { key: "legal_status", column: "pl.legal_status", type: "eq" },
      { key: "direction", column: "pl.direction", type: "eq" },
      { key: "structure_type", column: "pl.structure_type", type: "eq" },
      { key: "access_road", column: "pl.access_road", type: "eq" },
      { key: "furnished", column: "pl.furnished", type: "eq" },
      { key: "building_type", column: "pl.building_type", type: "eq" },
      { key: "price_min", column: "pl.price_vnd", type: "gte" },
      { key: "price_max", column: "pl.price_vnd", type: "lte" },
      { key: "area_min", column: "pl.area_m2", type: "gte" },
      { key: "area_max", column: "pl.area_m2", type: "lte" },
      { key: "num_bedrooms_min", column: "pl.num_bedrooms", type: "gte" },
      { key: "corner_lot", column: "pl.corner_lot", type: "bool" },
      { key: "has_elevator", column: "pl.has_elevator", type: "bool" },
      { key: "negotiable", column: "pl.negotiable", type: "bool" },
      { key: "num_frontages_min", column: "pl.num_frontages", type: "gte" },
      { key: "distance_to_beach_max", column: "pl.distance_to_beach_m", type: "lte" },
      { key: "agent_id", column: "pl.agent_id", type: "eq" },
    ];

    for (const filter of filters) {
      const value = searchParams.get(filter.key);
      if (value === null || value === "") continue;

      if (filter.type === "eq") {
        if (filter.key === "agent_id") {
          const agentId = parseInt(value, 10);
          if (!isNaN(agentId)) {
            conditions.push(`${filter.column} = $${paramIndex}`);
            params.push(agentId);
            paramIndex++;
          }
        } else {
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
        if (value === "true") {
          conditions.push(`${filter.column} = TRUE`);
        } else if (value === "false") {
          conditions.push(`${filter.column} = FALSE`);
        }
      }
    }

    if (searchParams.get("is_favorited") === "true") {
      conditions.push(`EXISTS(SELECT 1 FROM listing_favorites f WHERE f.listing_id = pl.id AND f.agent_id = $${paramIndex})`);
      params.push(auth.userId);
      paramIndex++;
    }

    // P6: Hide deposit/sold/not_for_sale unless current agent is owner or has favorited
    conditions.push(`(pl.status NOT IN ('deposit', 'sold', 'not_for_sale') OR pl.agent_id = $${paramIndex} OR EXISTS(SELECT 1 FROM listing_favorites f WHERE f.listing_id = pl.id AND f.agent_id = $${paramIndex}))`);
    params.push(auth.userId);
    paramIndex++;

    const whereClause = conditions.join(" AND ");

    // Count total for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM parsed_listings pl WHERE ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Main query with JOIN for owner info and LEFT JOIN for existing conversation
    const userIdParam = paramIndex;
    params.push(auth.userId);
    paramIndex++;

    const limitParam = paramIndex;
    params.push(limit);
    paramIndex++;

    const offsetParam = paramIndex;
    params.push(offset);

    const result = await pool.query(
      `SELECT
        pl.*,
        a.username AS owner_username,
        a.first_name AS owner_first_name,
        a.last_name AS owner_last_name,
        a.phone AS owner_phone,
        a.email AS owner_email,
        c.id AS existing_conversation_id,
        (SELECT COUNT(*) FROM listing_photos lp WHERE lp.listing_id = pl.id) AS photo_count,
        (SELECT lp.file_path FROM listing_photos lp WHERE lp.listing_id = pl.id ORDER BY lp.is_primary DESC, lp.display_order LIMIT 1) AS primary_photo,
        EXISTS(SELECT 1 FROM listing_favorites f WHERE f.listing_id = pl.id AND f.agent_id = $${userIdParam}) AS is_favorited
      FROM parsed_listings pl
      JOIN agents a ON a.id = pl.agent_id
      LEFT JOIN conversations c ON (
        c.listing_id = pl.id
        AND c.agent_1_id = LEAST(pl.agent_id, $${userIdParam})
        AND c.agent_2_id = GREATEST(pl.agent_id, $${userIdParam})
      )
      WHERE ${whereClause}
      ORDER BY
        CASE pl.status
          WHEN 'just_listed' THEN 1
          WHEN 'price_dropped' THEN 2
          WHEN 'price_increased' THEN 2
          WHEN 'selling' THEN 3
          WHEN 'deposit' THEN 4
          WHEN 'sold' THEN 4
          WHEN 'not_for_sale' THEN 4
          ELSE 5
        END,
        pl.${safeSort} ${safeOrder}
      LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params,
    );

    const listings = result.rows.map((row) => ({
      ...row,
      status: resolveStatus(row.status, row.created_at),
    }));
    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Feed GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
