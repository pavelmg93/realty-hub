import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const agentId = parseInt(id, 10);
    if (isNaN(agentId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const agentResult = await pool.query(
      `SELECT id, first_name, last_name, username, phone, email, name, avatar_url
       FROM agents
       WHERE id = $1`,
      [agentId]
    );
    if (agentResult.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const agent = agentResult.rows[0];
    const countResult = await pool.query(
      `SELECT COUNT(*) AS cnt FROM parsed_listings WHERE agent_id = $1 AND archived_at IS NULL`,
      [agentId]
    );
    const listing_count = parseInt(countResult.rows[0]?.cnt ?? "0", 10);
    const listingsResult = await pool.query(
      `SELECT pl.id, pl.ward, pl.street, pl.price_vnd, pl.property_type, pl.area_m2, pl.status,
              (SELECT lp.file_path FROM listing_photos lp WHERE lp.listing_id = pl.id ORDER BY lp.display_order LIMIT 1) AS primary_photo
       FROM parsed_listings pl
       WHERE pl.agent_id = $1 AND pl.archived_at IS NULL
       ORDER BY pl.updated_at DESC
       LIMIT 10`,
      [agentId]
    );
    const is_favorited = await pool.query(
      `SELECT 1 FROM agent_favorites WHERE agent_id = $1 AND favorited_agent_id = $2`,
      [auth.userId, agentId]
    );
    return NextResponse.json({
      agent: {
        ...agent,
        listing_count,
        is_favorited: is_favorited.rows.length > 0,
      },
      listings: listingsResult.rows,
    });
  } catch (error) {
    console.error("Agent GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
