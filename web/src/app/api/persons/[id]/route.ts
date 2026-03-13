import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

const STATUSES = [
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
      `SELECT id, type, full_name, phone, zalo, email, notes, status,
              buyer_criteria, created_by_agent_id, created_at, updated_at
       FROM persons
       WHERE id = $1 AND created_by_agent_id = $2`,
      [id, auth.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ person: result.rows[0] });
  } catch (error) {
    console.error("Person GET error:", error);
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

    if (typeof body.full_name === "string" && body.full_name.trim()) {
      updates.push(`full_name = $${idx++}`);
      values.push(body.full_name.trim());
    }
    if (body.phone !== undefined) {
      updates.push(`phone = $${idx++}`);
      values.push(typeof body.phone === "string" ? body.phone.trim() || null : null);
    }
    if (body.email !== undefined) {
      updates.push(`email = $${idx++}`);
      values.push(typeof body.email === "string" ? body.email.trim() || null : null);
    }
    if (body.zalo !== undefined) {
      updates.push(`zalo = $${idx++}`);
      values.push(typeof body.zalo === "string" ? body.zalo.trim() || null : null);
    }
    if (body.notes !== undefined) {
      updates.push(`notes = $${idx++}`);
      values.push(typeof body.notes === "string" ? body.notes.trim() || null : null);
    }
    if (body.status && STATUSES.includes(body.status)) {
      updates.push(`status = $${idx++}`);
      values.push(body.status);
    }
    if (body.buyer_criteria != null) {
      updates.push(`buyer_criteria = $${idx++}::jsonb`);
      values.push(JSON.stringify(body.buyer_criteria));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, auth.userId);
    const whereIdx = idx;
    const whereIdx2 = idx + 1;

    const result = await pool.query(
      `UPDATE persons SET ${updates.join(", ")}
       WHERE id = $${whereIdx} AND created_by_agent_id = $${whereIdx2}
       RETURNING id, type, full_name, phone, zalo, email, notes, status, buyer_criteria, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ person: result.rows[0] });
  } catch (error) {
    console.error("Person PATCH error:", error);
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
      `DELETE FROM persons WHERE id = $1 AND created_by_agent_id = $2 RETURNING id`,
      [id, auth.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Person DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
