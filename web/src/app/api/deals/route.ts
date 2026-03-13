import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

const STAGES = [
  "lead",
  "engaged",
  "considering",
  "viewing",
  "negotiating",
  "closing",
  "won",
  "lost",
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");

    let query = `
      SELECT d.id, d.listing_id, d.buyer_person_id, d.seller_person_id, d.agent_id,
             d.stage, d.stage_updated_at, d.value_vnd, d.notes, d.closed_at, d.created_at, d.updated_at,
             pb.full_name AS buyer_name, ps.full_name AS seller_name,
             pl.ward AS listing_ward, pl.property_type AS listing_property_type, pl.price_vnd AS listing_price_vnd
      FROM deals d
      LEFT JOIN persons pb ON pb.id = d.buyer_person_id
      LEFT JOIN persons ps ON ps.id = d.seller_person_id
      LEFT JOIN parsed_listings pl ON pl.id = d.listing_id
      WHERE d.agent_id = $1`;
    const params: (string | number)[] = [auth.userId];
    let idx = 2;

    if (stage && STAGES.includes(stage)) {
      query += ` AND d.stage = $${idx}`;
      params.push(stage);
      idx++;
    }

    query += ` ORDER BY d.stage_updated_at DESC, d.updated_at DESC`;

    const result = await pool.query(query, params);
    return NextResponse.json({ deals: result.rows });
  } catch (error) {
    console.error("Deals GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
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
    const listingId = body.listing_id != null ? parseInt(String(body.listing_id), 10) : null;
    const buyerPersonId = body.buyer_person_id || null;
    const sellerPersonId = body.seller_person_id || null;
    const stage = body.stage && STAGES.includes(body.stage) ? body.stage : "lead";
    const valueVnd = body.value_vnd != null ? parseInt(String(body.value_vnd), 10) : null;
    const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

    const result = await pool.query(
      `INSERT INTO deals (listing_id, buyer_person_id, seller_person_id, agent_id, stage, value_vnd, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, listing_id, buyer_person_id, seller_person_id, agent_id, stage, stage_updated_at, value_vnd, notes, created_at, updated_at`,
      [listingId, buyerPersonId, sellerPersonId, auth.userId, stage, valueVnd, notes]
    );

    return NextResponse.json({ deal: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Deals POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
