import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import { messageSchema } from "@/lib/validation";

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
    const conversationId = parseInt(id, 10);
    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: "Invalid conversation ID" },
        { status: 400 },
      );
    }

    // Verify participant
    const convo = await pool.query(
      `SELECT agent_1_id, agent_2_id FROM conversations WHERE id = $1`,
      [conversationId],
    );
    if (convo.rows.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }
    const { agent_1_id, agent_2_id } = convo.rows[0];
    if (auth.userId !== agent_1_id && auth.userId !== agent_2_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get messages
    const result = await pool.query(
      `SELECT m.id, m.conversation_id, m.sender_id, m.body,
              m.listing_id, m.created_at, m.read_at,
              a.name AS sender_name
       FROM messages m
       JOIN agents a ON a.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId],
    );

    // Mark unread messages from the other party as read
    await pool.query(
      `UPDATE messages
       SET read_at = NOW()
       WHERE conversation_id = $1
         AND sender_id != $2
         AND read_at IS NULL`,
      [conversationId, auth.userId],
    );

    return NextResponse.json({ messages: result.rows });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
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
    const conversationId = parseInt(id, 10);
    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: "Invalid conversation ID" },
        { status: 400 },
      );
    }

    // Verify participant
    const convo = await pool.query(
      `SELECT agent_1_id, agent_2_id FROM conversations WHERE id = $1`,
      [conversationId],
    );
    if (convo.rows.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }
    const { agent_1_id, agent_2_id } = convo.rows[0];
    if (auth.userId !== agent_1_id && auth.userId !== agent_2_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { body: messageBody, listing_id } = parsed.data;

    // Insert message
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body, listing_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [conversationId, auth.userId, messageBody, listing_id ?? null],
    );

    // Update conversation's updated_at
    await pool.query(
      `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
      [conversationId],
    );

    return NextResponse.json({ message: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
