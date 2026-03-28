import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { first_name, last_name, phone, email, dob_year } = body;
    await pool.query(
      `UPDATE agents SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
       phone = COALESCE($3, phone), email = COALESCE($4, email), dob_year = $5
       WHERE id = $6`,
      [first_name, last_name, phone, email, dob_year ?? null, auth.userId],
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Agents me PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let agentResult;
    try {
      agentResult = await pool.query(
        `SELECT id, first_name, last_name, username, phone, email, name, avatar_url, zalo_id, dob_year
         FROM agents
         WHERE id = $1`,
        [auth.userId],
      );
    } catch {
      agentResult = await pool.query(
        `SELECT id, first_name, last_name, username, phone, email, name, zalo_id, dob_year
         FROM agents
         WHERE id = $1`,
        [auth.userId],
      );
    }
    if (agentResult.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const agent = { ...agentResult.rows[0], avatar_url: agentResult.rows[0].avatar_url ?? null };
    const countResult = await pool.query(
      `SELECT COUNT(*) AS cnt FROM parsed_listings WHERE agent_id = $1 AND archived_at IS NULL`,
      [auth.userId],
    );
    const listing_count = parseInt(countResult.rows[0]?.cnt ?? "0", 10);

    const listingsResult = await pool.query(
      `SELECT pl.id, pl.ward, pl.street, pl.price_vnd, pl.property_type, pl.area_m2, pl.status,
              (SELECT lp.file_path FROM listing_photos lp WHERE lp.listing_id = pl.id ORDER BY lp.display_order LIMIT 1) AS primary_photo
       FROM parsed_listings pl
       WHERE pl.agent_id = $1 AND pl.archived_at IS NULL
       ORDER BY pl.updated_at DESC
       LIMIT 50`,
      [auth.userId],
    );

    return NextResponse.json({
      agent: { ...agent, listing_count },
      listings: listingsResult.rows,
    });
  } catch (error) {
    console.error("Agents me GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
