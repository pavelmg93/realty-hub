import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listing_id");
    const includeArchived = searchParams.get("archived") === "1";

    const params: (string | number)[] = [auth.userId];
    let whereClause = "WHERE (c.agent_1_id = $1 OR c.agent_2_id = $1)";
    const otherAgentIdStr = searchParams.get("other_agent_id");
    const otherAgentId = otherAgentIdStr ? parseInt(otherAgentIdStr, 10) : NaN;
    if (listingId) {
      const lid = parseInt(listingId, 10);
      if (!isNaN(lid)) {
        params.push(lid);
        const listingParam = params.length;
        if (!isNaN(otherAgentId)) {
          params.push(otherAgentId);
          const otherParam = params.length;
          // Match by listing_id; also include legacy conversations (no listing_id) with the listing owner
          whereClause += ` AND (c.listing_id = $${listingParam} OR (c.listing_id IS NULL AND (c.agent_1_id = $${otherParam} OR c.agent_2_id = $${otherParam})))`;
        } else {
          whereClause += ` AND c.listing_id = $${listingParam}`;
        }
      }
    } else if (!isNaN(otherAgentId)) {
      params.push(otherAgentId);
      whereClause += ` AND (c.agent_1_id = $${params.length} OR c.agent_2_id = $${params.length})`;
    }

    let rows: Record<string, unknown>[];
    try {
      const query = `
      SELECT
        c.id, c.agent_1_id, c.agent_2_id, c.listing_id,
        c.created_at, c.updated_at, c.archived_at,
        CASE WHEN c.agent_1_id = $1 THEN a2.name ELSE a1.name END AS other_agent_name,
        CASE WHEN c.agent_1_id = $1 THEN a2.username ELSE a1.username END AS other_agent_username,
        CASE WHEN c.agent_1_id = $1 THEN a2.first_name ELSE a1.first_name END AS other_agent_first_name,
        CASE WHEN c.agent_1_id = $1 THEN a2.phone ELSE a1.phone END AS other_agent_phone,
        CASE WHEN c.agent_1_id = $1 THEN a2.avatar_url ELSE a1.avatar_url END AS other_agent_avatar_url,
        pl.property_type AS listing_property_type, pl.ward AS listing_ward,
        pl.street AS listing_street, pl.title_standardized AS listing_title_standardized,
        pl.price_vnd AS listing_price_vnd, pl.area_m2 AS listing_area_m2,
        (SELECT lp.file_path FROM listing_photos lp WHERE lp.listing_id = pl.id ORDER BY lp.display_order LIMIT 1) AS listing_primary_photo,
        last_msg.body AS last_message_preview, last_msg.created_at AS last_message_at,
        COALESCE(unread.cnt, 0) AS unread_count
      FROM conversations c
      JOIN agents a1 ON a1.id = c.agent_1_id
      JOIN agents a2 ON a2.id = c.agent_2_id
      LEFT JOIN parsed_listings pl ON pl.id = c.listing_id
      LEFT JOIN LATERAL (SELECT body, created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) last_msg ON TRUE
      LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND read_at IS NULL) unread ON TRUE
      ${whereClause}${!includeArchived ? " AND c.archived_at IS NULL" : ""}
      ORDER BY c.updated_at DESC`;
      const result = await pool.query(query, params);
      rows = result.rows;
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "";
      if (msg.includes("archived_at")) {
        const fallback = `
      SELECT c.id, c.agent_1_id, c.agent_2_id, c.listing_id, c.created_at, c.updated_at,
        CASE WHEN c.agent_1_id = $1 THEN a2.name ELSE a1.name END AS other_agent_name,
        CASE WHEN c.agent_1_id = $1 THEN a2.username ELSE a1.username END AS other_agent_username,
        CASE WHEN c.agent_1_id = $1 THEN a2.first_name ELSE a1.first_name END AS other_agent_first_name,
        CASE WHEN c.agent_1_id = $1 THEN a2.phone ELSE a1.phone END AS other_agent_phone,
        CASE WHEN c.agent_1_id = $1 THEN a2.avatar_url ELSE a1.avatar_url END AS other_agent_avatar_url,
        pl.property_type AS listing_property_type, pl.ward AS listing_ward,
        pl.street AS listing_street, pl.title_standardized AS listing_title_standardized,
        pl.price_vnd AS listing_price_vnd, pl.area_m2 AS listing_area_m2,
        (SELECT lp.file_path FROM listing_photos lp WHERE lp.listing_id = pl.id ORDER BY lp.display_order LIMIT 1) AS listing_primary_photo,
        last_msg.body AS last_message_preview, last_msg.created_at AS last_message_at,
        COALESCE(unread.cnt, 0) AS unread_count
      FROM conversations c
      JOIN agents a1 ON a1.id = c.agent_1_id
      JOIN agents a2 ON a2.id = c.agent_2_id
      LEFT JOIN parsed_listings pl ON pl.id = c.listing_id
      LEFT JOIN LATERAL (SELECT body, created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) last_msg ON TRUE
      LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND read_at IS NULL) unread ON TRUE
      ${whereClause}
      ORDER BY c.updated_at DESC`;
        const result = await pool.query(fallback, params);
        rows = result.rows;
      } else {
        throw err;
      }
    }

    return NextResponse.json({ conversations: rows });
  } catch (error) {
    console.error("Conversations GET error:", error);
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
    const otherAgentId = body.other_agent_id;
    const listingId = body.listing_id != null ? (typeof body.listing_id === "number" ? body.listing_id : parseInt(String(body.listing_id), 10)) : null;

    if (!otherAgentId || typeof otherAgentId !== "number") {
      return NextResponse.json(
        { error: "other_agent_id is required and must be a number" },
        { status: 400 },
      );
    }

    if (otherAgentId === auth.userId) {
      return NextResponse.json(
        { error: "Cannot create a conversation with yourself" },
        { status: 400 },
      );
    }

    // Verify the other agent exists
    const agentCheck = await pool.query(
      `SELECT id FROM agents WHERE id = $1`,
      [otherAgentId],
    );
    if (agentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (listingId != null && !Number.isNaN(listingId)) {
      const listingCheck = await pool.query(
        `SELECT id FROM parsed_listings WHERE id = $1`,
        [listingId],
      );
      if (listingCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "Listing not found" },
          { status: 404 },
        );
      }
    }

    const agent1 = Math.min(auth.userId, otherAgentId);
    const agent2 = Math.max(auth.userId, otherAgentId);
    const listingIdVal = listingId != null && !Number.isNaN(listingId) ? listingId : null;

    await pool.query(
      `INSERT INTO conversations (agent_1_id, agent_2_id, listing_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (agent_1_id, agent_2_id, listing_id) DO NOTHING`,
      [agent1, agent2, listingIdVal],
    );

    const result = await pool.query(
      `SELECT * FROM conversations
       WHERE agent_1_id = $1 AND agent_2_id = $2 AND (listing_id IS NOT DISTINCT FROM $3)`,
      [agent1, agent2, listingIdVal],
    );

    return NextResponse.json(
      { conversation: result.rows[0] },
      { status: 201 },
    );
  } catch (error) {
    console.error("Conversations POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
