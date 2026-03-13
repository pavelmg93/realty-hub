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
    const result = await pool.query(
      `SELECT d.id, d.listing_id, d.buyer_person_id, d.seller_person_id, d.agent_id,
              d.stage, d.stage_updated_at, d.value_vnd, d.notes, d.closed_at, d.created_at, d.updated_at,
              pb.full_name AS buyer_name, ps.full_name AS seller_name,
              pl.ward AS listing_ward, pl.property_type AS listing_property_type, pl.price_vnd AS listing_price_vnd
       FROM deals d
       LEFT JOIN persons pb ON pb.id = d.buyer_person_id
       LEFT JOIN persons ps ON ps.id = d.seller_person_id
       LEFT JOIN parsed_listings pl ON pl.id = d.listing_id
       WHERE d.id = $1 AND d.agent_id = $2`,
      [id, auth.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ deal: result.rows[0] });
  } catch (error) {
    console.error("Deal GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let idx = 1;

    if (body.stage && STAGES.includes(body.stage)) {
      updates.push(`stage = $${idx++}`);
      values.push(body.stage);
      updates.push(`stage_updated_at = NOW()`);
      if (body.stage === "won" || body.stage === "lost") {
        updates.push(`closed_at = NOW()`);
      }
    }
    if (body.value_vnd !== undefined) {
      updates.push(`value_vnd = $${idx++}`);
      values.push(body.value_vnd != null ? parseInt(String(body.value_vnd), 10) : null);
    }
    if (body.notes !== undefined) {
      updates.push(`notes = $${idx++}`);
      values.push(typeof body.notes === "string" ? body.notes.trim() || null : null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, auth.userId);
    const whereIdx = idx;
    const whereIdx2 = idx + 1;

    const result = await pool.query(
      `UPDATE deals SET ${updates.join(", ")}
       WHERE id = $${whereIdx} AND agent_id = $${whereIdx2}
       RETURNING id, listing_id, buyer_person_id, seller_person_id, agent_id, stage, stage_updated_at, value_vnd, notes, closed_at, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const deal = result.rows[0];
    if (body.stage && STAGES.includes(body.stage)) {
      const personIds: string[] = [deal.buyer_person_id, deal.seller_person_id].filter(Boolean);
      if (personIds.length > 0) {
        await pool.query(
          `UPDATE persons SET status = $1, updated_at = NOW()
           WHERE id = ANY($2::uuid[]) AND created_by_agent_id = $3`,
          [body.stage, personIds, auth.userId]
        );
      }
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error("Deal PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
