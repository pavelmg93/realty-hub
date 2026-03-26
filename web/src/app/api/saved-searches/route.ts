import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await pool.query(
      `SELECT ss.*,
        COALESCE(
          json_agg(
            json_build_object('id', p.id, 'full_name', p.full_name, 'type', p.type)
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS persons
      FROM saved_searches ss
      LEFT JOIN saved_search_persons ssp ON ssp.saved_search_id = ss.id
      LEFT JOIN persons p ON p.id = ssp.person_id
      WHERE ss.agent_id = $1
      GROUP BY ss.id
      ORDER BY ss.updated_at DESC`,
      [auth.userId]
    );

    return NextResponse.json({ saved_searches: result.rows });
  } catch (error) {
    console.error("Saved searches GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, query, filters, person_ids } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO saved_searches (agent_id, name, query, filters)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [auth.userId, name.trim(), query || "", filters ? JSON.stringify(filters) : "{}"]
      );
      const savedSearch = result.rows[0];

      if (Array.isArray(person_ids) && person_ids.length > 0) {
        const values = person_ids
          .map((_: string, i: number) => `($1, $${i + 2})`)
          .join(", ");
        await client.query(
          `INSERT INTO saved_search_persons (saved_search_id, person_id) VALUES ${values}
           ON CONFLICT DO NOTHING`,
          [savedSearch.id, ...person_ids]
        );
      }

      await client.query("COMMIT");
      return NextResponse.json({ saved_search: savedSearch }, { status: 201 });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Saved searches POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
