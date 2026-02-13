import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

const VALID_CATEGORIES = [
  "ownership_cert",
  "floorplan",
  "property_sketch",
  "use_permit",
  "construction_permit",
  "proposal",
  "other",
];

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
      `SELECT * FROM listing_documents WHERE listing_id = $1 ORDER BY category, created_at DESC`,
      [listingId],
    );

    return NextResponse.json({ documents: result.rows });
  } catch (error) {
    console.error("Documents GET error:", error);
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
    const { file_path, file_name, original_name, file_size, mime_type, category, notes } = body;

    if (!file_path || !file_name) {
      return NextResponse.json(
        { error: "file_path and file_name required" },
        { status: 400 },
      );
    }

    const safeCategory = VALID_CATEGORIES.includes(category) ? category : "other";

    const result = await pool.query(
      `INSERT INTO listing_documents (listing_id, file_path, file_name, original_name, file_size, mime_type, category, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        listingId,
        file_path,
        file_name,
        original_name || null,
        file_size || null,
        mime_type || null,
        safeCategory,
        notes || null,
      ],
    );

    return NextResponse.json({ document: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Documents POST error:", error);
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
    const docId = parseInt(searchParams.get("docId") || "", 10);

    if (isNaN(listingId) || isNaN(docId)) {
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
      `DELETE FROM listing_documents WHERE id = $1 AND listing_id = $2`,
      [docId, listingId],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Documents DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
