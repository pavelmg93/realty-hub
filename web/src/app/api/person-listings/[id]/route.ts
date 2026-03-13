import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

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

    if (body.rating !== undefined) {
      const r = body.rating == null ? null : Math.min(5, Math.max(1, parseInt(String(body.rating), 10)));
      updates.push(`rating = $${idx++}`);
      values.push(r);
    }
    if (body.notes !== undefined) {
      updates.push(`notes = $${idx++}`);
      values.push(typeof body.notes === "string" ? body.notes.trim() || null : null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    const whereIdx = idx;

    const result = await pool.query(
      `UPDATE person_listings pl
       SET ${updates.join(", ")}
       FROM persons p
       WHERE pl.id = $${whereIdx} AND pl.person_id = p.id AND p.created_by_agent_id = $${whereIdx + 1}
       RETURNING pl.id, pl.person_id, pl.listing_id, pl.role, pl.rating, pl.notes, pl.created_at`,
      [...values, auth.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ person_listing: result.rows[0] });
  } catch (error) {
    console.error("Person-listings PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      `DELETE FROM person_listings pl
       USING persons p
       WHERE pl.id = $1 AND pl.person_id = p.id AND p.created_by_agent_id = $2
       RETURNING pl.id`,
      [id, auth.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Person-listings DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
