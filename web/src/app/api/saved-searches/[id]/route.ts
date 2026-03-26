import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const ssId = parseInt(id, 10);
    if (isNaN(ssId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const result = await pool.query(
      "DELETE FROM saved_searches WHERE id = $1 AND agent_id = $2 RETURNING id",
      [ssId, auth.userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Saved search DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const ssId = parseInt(id, 10);
    if (isNaN(ssId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await request.json();
    const { name, query, filters, person_ids } = body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const sets: string[] = ["updated_at = NOW()"];
      const vals: (string | number)[] = [];
      let pi = 1;

      if (name !== undefined) {
        sets.push(`name = $${pi}`);
        vals.push(name);
        pi++;
      }
      if (query !== undefined) {
        sets.push(`query = $${pi}`);
        vals.push(query);
        pi++;
      }
      if (filters !== undefined) {
        sets.push(`filters = $${pi}`);
        vals.push(JSON.stringify(filters));
        pi++;
      }

      vals.push(ssId, auth.userId);
      const result = await client.query(
        `UPDATE saved_searches SET ${sets.join(", ")} WHERE id = $${pi} AND agent_id = $${pi + 1} RETURNING *`,
        vals
      );

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      if (Array.isArray(person_ids)) {
        await client.query("DELETE FROM saved_search_persons WHERE saved_search_id = $1", [ssId]);
        if (person_ids.length > 0) {
          const values = person_ids
            .map((_: string, i: number) => `($1, $${i + 2})`)
            .join(", ");
          await client.query(
            `INSERT INTO saved_search_persons (saved_search_id, person_id) VALUES ${values}
             ON CONFLICT DO NOTHING`,
            [ssId, ...person_ids]
          );
        }
      }

      await client.query("COMMIT");
      return NextResponse.json({ saved_search: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Saved search PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
