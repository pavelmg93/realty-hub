import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

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
    const conversationId = parseInt(id, 10);
    if (Number.isNaN(conversationId)) {
      return NextResponse.json(
        { error: "Invalid conversation ID" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `SELECT
        c.id, c.agent_1_id, c.agent_2_id, c.listing_id,
        c.created_at, c.updated_at,
        CASE WHEN c.agent_1_id = $1 THEN a2.name ELSE a1.name END AS other_agent_name,
        CASE WHEN c.agent_1_id = $1 THEN a2.username ELSE a1.username END AS other_agent_username,
        CASE WHEN c.agent_1_id = $1 THEN a2.first_name ELSE a1.first_name END AS other_agent_first_name,
        CASE WHEN c.agent_1_id = $1 THEN a2.phone ELSE a1.phone END AS other_agent_phone,
        CASE WHEN c.agent_1_id = $1 THEN a2.email ELSE a1.email END AS other_agent_email,
        CASE WHEN c.agent_1_id = $1 THEN a2.avatar_url ELSE a1.avatar_url END AS other_agent_avatar_url,
        pl.property_type AS listing_property_type,
        pl.ward AS listing_ward,
        pl.price_vnd AS listing_price_vnd,
        pl.area_m2 AS listing_area_m2,
        (SELECT lp.file_path FROM listing_photos lp WHERE lp.listing_id = pl.id ORDER BY lp.display_order LIMIT 1) AS listing_primary_photo
      FROM conversations c
      JOIN agents a1 ON a1.id = c.agent_1_id
      JOIN agents a2 ON a2.id = c.agent_2_id
      LEFT JOIN parsed_listings pl ON pl.id = c.listing_id
      WHERE c.id = $2 AND (c.agent_1_id = $1 OR c.agent_2_id = $1)`,
      [auth.userId, conversationId],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ conversation: result.rows[0] });
  } catch (error) {
    console.error("Conversations GET [id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const conversationId = parseInt(id, 10);
    if (Number.isNaN(conversationId)) {
      return NextResponse.json(
        { error: "Invalid conversation ID" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const archive = body.archived === true;

    const convo = await pool.query(
      `SELECT agent_1_id, agent_2_id FROM conversations WHERE id = $1`,
      [conversationId],
    );
    if (convo.rows.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const { agent_1_id, agent_2_id } = convo.rows[0];
    if (agent_1_id !== auth.userId && agent_2_id !== auth.userId) {
      return NextResponse.json(
        { error: "You don't have access to this conversation" },
        { status: 403 },
      );
    }

    // archived_at column not yet on conversations table — just update updated_at
    await pool.query(
      `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
      [conversationId],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Conversations PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
