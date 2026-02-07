import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listing_id");

    let query = `
      SELECT
        c.id, c.agent_1_id, c.agent_2_id, c.created_at, c.updated_at,
        CASE
          WHEN c.agent_1_id = $1 THEN a2.name
          ELSE a1.name
        END AS other_agent_name,
        CASE
          WHEN c.agent_1_id = $1 THEN a2.username
          ELSE a1.username
        END AS other_agent_username,
        last_msg.body AS last_message_preview,
        last_msg.created_at AS last_message_at,
        COALESCE(unread.cnt, 0) AS unread_count
      FROM conversations c
      JOIN agents a1 ON a1.id = c.agent_1_id
      JOIN agents a2 ON a2.id = c.agent_2_id
      LEFT JOIN LATERAL (
        SELECT body, created_at
        FROM messages
        WHERE conversation_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) last_msg ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS cnt
        FROM messages
        WHERE conversation_id = c.id
          AND sender_id != $1
          AND read_at IS NULL
      ) unread ON TRUE
      WHERE c.agent_1_id = $1 OR c.agent_2_id = $1`;

    const params: (string | number)[] = [auth.userId];

    if (listingId) {
      const lid = parseInt(listingId, 10);
      if (!isNaN(lid)) {
        query += `
          AND EXISTS (
            SELECT 1 FROM messages m
            WHERE m.conversation_id = c.id AND m.listing_id = $2
          )`;
        params.push(lid);
      }
    }

    query += ` ORDER BY c.updated_at DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json({ conversations: result.rows });
  } catch (error) {
    console.error("Conversations GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
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
    const otherAgentId = body.other_agent_id;

    if (!otherAgentId || typeof otherAgentId !== "number") {
      return NextResponse.json(
        { error: "other_agent_id is required and must be a number" },
        { status: 400 },
      );
    }

    if (otherAgentId === auth.userId) {
      return NextResponse.json(
        { error: "Cannot create a conversation with yourself" },
        { status: 400 },
      );
    }

    // Verify the other agent exists
    const agentCheck = await pool.query(
      `SELECT id FROM agents WHERE id = $1`,
      [otherAgentId],
    );
    if (agentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Use LEAST/GREATEST to enforce the ordered pair constraint
    const agent1 = Math.min(auth.userId, otherAgentId);
    const agent2 = Math.max(auth.userId, otherAgentId);

    // INSERT ON CONFLICT DO NOTHING, then SELECT
    await pool.query(
      `INSERT INTO conversations (agent_1_id, agent_2_id)
       VALUES ($1, $2)
       ON CONFLICT (agent_1_id, agent_2_id) DO NOTHING`,
      [agent1, agent2],
    );

    const result = await pool.query(
      `SELECT * FROM conversations
       WHERE agent_1_id = $1 AND agent_2_id = $2`,
      [agent1, agent2],
    );

    return NextResponse.json(
      { conversation: result.rows[0] },
      { status: 201 },
    );
  } catch (error) {
    console.error("Conversations POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
