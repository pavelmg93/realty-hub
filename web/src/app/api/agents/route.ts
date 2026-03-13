import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT id, first_name, last_name, username, phone, email, name
       FROM agents
       WHERE username IS NOT NULL
       ORDER BY first_name, username`
    );
    return NextResponse.json({ agents: result.rows });
  } catch (error) {
    console.error("Agents GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
