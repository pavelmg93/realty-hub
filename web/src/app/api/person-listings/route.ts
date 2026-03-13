import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

const ROLES = ["buyer_interest", "seller", "co_agent"] as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const personId = searchParams.get("person_id");
    const listingId = searchParams.get("listing_id");
    const type = searchParams.get("type"); // 'buyer' | 'seller' — return all person_listings for persons of this type

    if (!personId && !listingId && type !== "buyer" && type !== "seller") {
      return NextResponse.json(
        { error: "Provide person_id, listing_id, or type (buyer|seller)" },
        { status: 400 }
      );
    }

    let query = `
      SELECT pl.id, pl.person_id, pl.listing_id, pl.role, pl.rating, pl.notes, pl.created_at,
             p.full_name AS person_name, p.type AS person_type,
             pl2.ward AS listing_ward, pl2.property_type AS listing_property_type, pl2.price_vnd AS listing_price_vnd
      FROM person_listings pl
      JOIN persons p ON p.id = pl.person_id AND p.created_by_agent_id = $1
      LEFT JOIN parsed_listings pl2 ON pl2.id = pl.listing_id
      WHERE 1=1`;
    const params: (string | number)[] = [auth.userId];
    let idx = 2;

    if (type === "buyer" || type === "seller") {
      query += ` AND p.type = $${idx}`;
      params.push(type);
      idx++;
    }
    if (personId && !type) {
      query += ` AND pl.person_id = $${idx}`;
      params.push(personId);
      idx++;
    }
    if (listingId && !type) {
      const lid = parseInt(listingId, 10);
      if (isNaN(lid)) {
        return NextResponse.json({ error: "Invalid listing_id" }, { status: 400 });
      }
      query += ` AND pl.listing_id = $${idx}`;
      params.push(lid);
    }

    query += ` ORDER BY pl.created_at DESC`;

    const result = await pool.query(query, params);
    return NextResponse.json({ person_listings: result.rows });
  } catch (error) {
    console.error("Person-listings GET error:", error);
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
    const personId = body.person_id;
    const listingId = body.listing_id != null ? parseInt(String(body.listing_id), 10) : null;
    const role = body.role && ROLES.includes(body.role) ? body.role : "buyer_interest";
    const rating =
      body.rating != null
        ? Math.min(5, Math.max(1, parseInt(String(body.rating), 10)))
        : null;
    const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

    if (!personId || !listingId || isNaN(listingId)) {
      return NextResponse.json(
        { error: "person_id and listing_id required" },
        { status: 400 }
      );
    }

    const check = await pool.query(
      `SELECT id FROM persons WHERE id = $1 AND created_by_agent_id = $2`,
      [personId, auth.userId]
    );
    if (check.rows.length === 0) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    const result = await pool.query(
      `INSERT INTO person_listings (person_id, listing_id, role, rating, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (person_id, listing_id, role) DO UPDATE SET rating = COALESCE(EXCLUDED.rating, person_listings.rating), notes = COALESCE(EXCLUDED.notes, person_listings.notes), created_at = NOW()
       RETURNING id, person_id, listing_id, role, rating, notes, created_at`,
      [personId, listingId, role, rating, notes]
    );

    return NextResponse.json({ person_listing: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Person-listings POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
