import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

/** GET /api/notifications — list notifications for current user */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));

    let query = `
      SELECT id, type, title, body, link, reference_id, is_read, created_at
      FROM notifications
      WHERE agent_id = $1
    `;
    const params: (number | boolean)[] = [auth.userId];

    if (unreadOnly) {
      query += " AND is_read = FALSE";
    }

    query += " ORDER BY created_at DESC LIMIT $2";
    params.push(limit);

    const result = await pool.query(query, params);

    // Also get unread count
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM notifications WHERE agent_id = $1 AND is_read = FALSE",
      [auth.userId],
    );
    const unreadCount = parseInt(countResult.rows[0].count, 10);

    return NextResponse.json({
      notifications: result.rows,
      unread_count: unreadCount,
    });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/notifications — mark notifications as read */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (action === "mark_read" && body.id) {
      await pool.query(
        "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND agent_id = $2",
        [body.id, auth.userId],
      );
    } else if (action === "mark_all_read") {
      await pool.query(
        "UPDATE notifications SET is_read = TRUE WHERE agent_id = $1 AND is_read = FALSE",
        [auth.userId],
      );
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Notifications POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
