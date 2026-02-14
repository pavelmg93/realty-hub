import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listingId = parseInt(id, 10);
  if (isNaN(listingId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const result = await pool.query(
    `SELECT
      (SELECT id FROM parsed_listings WHERE id < $1 AND archived_at IS NULL ORDER BY id DESC LIMIT 1) AS prev,
      (SELECT id FROM parsed_listings WHERE id > $1 AND archived_at IS NULL ORDER BY id ASC LIMIT 1) AS next`,
    [listingId],
  );

  const row = result.rows[0];
  return NextResponse.json({
    prev: row?.prev ? Number(row.prev) : null,
    next: row?.next ? Number(row.next) : null,
  });
}
