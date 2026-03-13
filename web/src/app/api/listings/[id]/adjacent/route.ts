import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listingId = parseInt(id, 10);
  if (isNaN(listingId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const scopeMine = searchParams.get("scope") === "mine";
  const auth = scopeMine ? await getAuthFromCookies() : null;
  if (scopeMine && !auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentFilter = scopeMine && auth ? " AND agent_id = $2" : "";
  const args = scopeMine && auth ? [listingId, auth.userId] : [listingId];

  const result = await pool.query(
    `SELECT
      (SELECT id FROM parsed_listings WHERE id < $1 AND archived_at IS NULL${agentFilter} ORDER BY id DESC LIMIT 1) AS prev,
      (SELECT id FROM parsed_listings WHERE id > $1 AND archived_at IS NULL${agentFilter} ORDER BY id ASC LIMIT 1) AS next`,
    args,
  );

  const row = result.rows[0];
  return NextResponse.json({
    prev: row?.prev ? Number(row.prev) : null,
    next: row?.next ? Number(row.next) : null,
  });
}
