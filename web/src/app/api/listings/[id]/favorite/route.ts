import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const listingId = parseInt(id, 10);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    // Toggle: if exists, remove; if not, add
    const existing = await pool.query(
      `SELECT 1 FROM listing_favorites WHERE agent_id = $1 AND listing_id = $2`,
      [auth.userId, listingId],
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `DELETE FROM listing_favorites WHERE agent_id = $1 AND listing_id = $2`,
        [auth.userId, listingId],
      );
      return NextResponse.json({ favorited: false });
    } else {
      await pool.query(
        `INSERT INTO listing_favorites (agent_id, listing_id) VALUES ($1, $2)
         ON CONFLICT (agent_id, listing_id) DO NOTHING`,
        [auth.userId, listingId],
      );
      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error("Listing Favorite POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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
    const listingId = parseInt(id, 10);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT 1 FROM listing_favorites WHERE agent_id = $1 AND listing_id = $2`,
      [auth.userId, listingId],
    );

    return NextResponse.json({ favorited: result.rows.length > 0 });
  } catch (error) {
    console.error("Listing Favorite GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
