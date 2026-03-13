import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ count: 0 });
    }

    const result = await pool.query(
      `SELECT COUNT(*) AS cnt
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE (c.agent_1_id = $1 OR c.agent_2_id = $1)
         AND m.sender_id != $1
         AND m.read_at IS NULL`,
      [auth.userId]
    );
    const count = parseInt(result.rows[0]?.cnt ?? "0", 10);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Unread count error:", error);
    return NextResponse.json({ count: 0 });
  }
}
