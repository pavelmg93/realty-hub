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
    const listingId = parseInt(id, 10);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT * FROM listing_photos WHERE listing_id = $1 ORDER BY display_order, created_at`,
      [listingId],
    );

    return NextResponse.json({ photos: result.rows });
  } catch (error) {
    console.error("Photos GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    // Verify ownership
    const listing = await pool.query(
      `SELECT agent_id FROM parsed_listings WHERE id = $1`,
      [listingId],
    );
    if (listing.rows.length === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.rows[0].agent_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { file_path, original_name, file_size } = body;

    if (!file_path) {
      return NextResponse.json({ error: "file_path required" }, { status: 400 });
    }

    // Get next display_order
    const orderResult = await pool.query(
      `SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM listing_photos WHERE listing_id = $1`,
      [listingId],
    );
    const displayOrder = orderResult.rows[0].next_order;

    const result = await pool.query(
      `INSERT INTO listing_photos (listing_id, file_path, original_name, file_size, display_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [listingId, file_path, original_name || null, file_size || null, displayOrder],
    );

    return NextResponse.json({ photo: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Photos POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const photoId = parseInt(searchParams.get("photoId") || "", 10);

    if (isNaN(listingId) || isNaN(photoId)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    // Verify ownership
    const listing = await pool.query(
      `SELECT agent_id FROM parsed_listings WHERE id = $1`,
      [listingId],
    );
    if (listing.rows.length === 0 || listing.rows[0].agent_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await pool.query(
      `DELETE FROM listing_photos WHERE id = $1 AND listing_id = $2`,
      [photoId, listingId],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Photos DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
