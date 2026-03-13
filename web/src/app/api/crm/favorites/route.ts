import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await pool.query(
      `SELECT favorited_agent_id FROM agent_favorites WHERE agent_id = $1`,
      [auth.userId]
    );
    const agent_ids = result.rows.map((r) => r.favorited_agent_id);
    return NextResponse.json({ agent_ids });
  } catch (error) {
    console.error("Favorites GET error:", error);
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
    const favoritedAgentId = body.favorited_agent_id != null ? parseInt(String(body.favorited_agent_id), 10) : null;
    if (!favoritedAgentId || favoritedAgentId === auth.userId) {
      return NextResponse.json({ error: "Invalid favorited_agent_id" }, { status: 400 });
    }
    const existing = await pool.query(
      `SELECT 1 FROM agent_favorites WHERE agent_id = $1 AND favorited_agent_id = $2`,
      [auth.userId, favoritedAgentId]
    );
    if (existing.rows.length > 0) {
      await pool.query(
        `DELETE FROM agent_favorites WHERE agent_id = $1 AND favorited_agent_id = $2`,
        [auth.userId, favoritedAgentId]
      );
      return NextResponse.json({ favorited: false });
    }
    await pool.query(
      `INSERT INTO agent_favorites (agent_id, favorited_agent_id) VALUES ($1, $2)
       ON CONFLICT (agent_id, favorited_agent_id) DO NOTHING`,
      [auth.userId, favoritedAgentId]
    );
    return NextResponse.json({ favorited: true });
  } catch (error) {
    console.error("Favorites POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
