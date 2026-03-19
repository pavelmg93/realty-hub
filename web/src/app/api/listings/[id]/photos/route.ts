import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

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
      `SELECT * FROM listing_photos WHERE listing_id = $1 ORDER BY is_primary DESC, display_order, created_at`,
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
    const { file_path, original_name, file_size, thumb_path } = body;

    if (!file_path) {
      return NextResponse.json({ error: "file_path required" }, { status: 400 });
    }

    // Check if this will be the first photo (auto-set as primary)
    const countResult = await pool.query(
      `SELECT COUNT(*) AS cnt FROM listing_photos WHERE listing_id = $1`,
      [listingId],
    );
    const isFirst = parseInt(countResult.rows[0].cnt, 10) === 0;

    const orderResult = await pool.query(
      `SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM listing_photos WHERE listing_id = $1`,
      [listingId],
    );
    const displayOrder = orderResult.rows[0].next_order;

    const result = await pool.query(
      `INSERT INTO listing_photos (listing_id, file_path, thumb_path, original_name, file_size, display_order, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [listingId, file_path, thumb_path || null, original_name || null, file_size || null, displayOrder, isFirst],
    );

    return NextResponse.json({ photo: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Photos POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Set a photo as primary for a listing
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const listingId = parseInt(id, 10);

    const listing = await pool.query(
      `SELECT agent_id FROM parsed_listings WHERE id = $1`,
      [listingId],
    );
    if (listing.rows.length === 0 || listing.rows[0].agent_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const photoId = parseInt(body.photoId, 10);
    if (isNaN(photoId)) {
      return NextResponse.json({ error: "photoId required" }, { status: 400 });
    }

    // Clear existing primary, then set new one
    await pool.query(
      `UPDATE listing_photos SET is_primary = FALSE WHERE listing_id = $1`,
      [listingId],
    );
    await pool.query(
      `UPDATE listing_photos SET is_primary = TRUE WHERE id = $1 AND listing_id = $2`,
      [photoId, listingId],
    );

    const result = await pool.query(
      `SELECT * FROM listing_photos WHERE listing_id = $1 ORDER BY is_primary DESC, display_order, created_at`,
      [listingId],
    );

    return NextResponse.json({ photos: result.rows });
  } catch (error) {
    console.error("Photos PATCH error:", error);
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

    const listing = await pool.query(
      `SELECT agent_id FROM parsed_listings WHERE id = $1`,
      [listingId],
    );
    if (listing.rows.length === 0 || listing.rows[0].agent_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch file paths before deleting
    const photoResult = await pool.query(
      `SELECT file_path, thumb_path FROM listing_photos WHERE id = $1 AND listing_id = $2`,
      [photoId, listingId],
    );

    await pool.query(
      `DELETE FROM listing_photos WHERE id = $1 AND listing_id = $2`,
      [photoId, listingId],
    );

    // Delete files from disk (non-blocking — don't fail if file missing)
    if (photoResult.rows.length > 0) {
      const { file_path, thumb_path } = photoResult.rows[0];
      const deleteFile = async (relPath: string | null) => {
        if (!relPath) return;
        try {
          await unlink(path.join(UPLOAD_DIR, relPath));
        } catch {
          // Ignore missing file errors
        }
      };
      await Promise.all([deleteFile(file_path), deleteFile(thumb_path)]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Photos DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
