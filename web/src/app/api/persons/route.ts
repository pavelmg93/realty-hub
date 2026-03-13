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

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'buyer' | 'seller'
    const status = searchParams.get("status");

    let query = `
      SELECT id, type, full_name, phone, zalo, email, notes, status,
             buyer_criteria, created_by_agent_id, created_at, updated_at
      FROM persons
      WHERE created_by_agent_id = $1`;
    const params: (string | number)[] = [auth.userId];
    let idx = 2;

    if (type === "buyer" || type === "seller") {
      query += ` AND type = $${idx}`;
      params.push(type);
      idx++;
    }
    if (status && STATUSES.includes(status)) {
      query += ` AND status = $${idx}`;
      params.push(status);
      idx++;
    }

    query += ` ORDER BY updated_at DESC`;

    const result = await pool.query(query, params);
    return NextResponse.json({ persons: result.rows });
  } catch (error) {
    console.error("Persons GET error:", error);
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
    const type = body.type === "buyer" || body.type === "seller" ? body.type : "buyer";
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    if (!fullName) {
      return NextResponse.json(
        { error: "full_name is required" },
        { status: 400 }
      );
    }
    const status = body.status && STATUSES.includes(body.status) ? body.status : "lead";
    const phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
    const email = typeof body.email === "string" ? body.email.trim() || null : null;
    const zalo = typeof body.zalo === "string" ? body.zalo.trim() || null : null;
    const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
    const buyerCriteria =
      type === "buyer" && body.buyer_criteria != null
        ? JSON.stringify(body.buyer_criteria)
        : null;

    const result = await pool.query(
      `INSERT INTO persons (type, full_name, phone, email, zalo, notes, status, created_by_agent_id, buyer_criteria)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
       RETURNING id, type, full_name, phone, zalo, email, notes, status, buyer_criteria, created_at, updated_at`,
      [type, fullName, phone, email, zalo, notes, status, auth.userId, buyerCriteria]
    );

    return NextResponse.json({ person: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Persons POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
