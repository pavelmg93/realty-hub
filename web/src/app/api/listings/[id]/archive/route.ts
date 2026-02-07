import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(
  request: NextRequest,
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
      return NextResponse.json(
        { error: "Invalid listing ID" },
        { status: 400 },
      );
    }

    // Verify ownership
    const existing = await pool.query(
      `SELECT agent_id FROM parsed_listings WHERE id = $1`,
      [listingId],
    );
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 },
      );
    }
    if (existing.rows[0].agent_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const archive = body.archive;

    if (typeof archive !== "boolean") {
      return NextResponse.json(
        { error: "Body must include 'archive' as a boolean" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `UPDATE parsed_listings
       SET archived_at = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [archive ? new Date().toISOString() : null, listingId],
    );

    return NextResponse.json({ listing: result.rows[0] });
  } catch (error) {
    console.error("Archive error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
