import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { username, first_name, last_name, password, email, phone } =
      parsed.data;

    // Check username uniqueness
    const existing = await pool.query(
      "SELECT id FROM agents WHERE username = $1",
      [username],
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const name = [first_name, last_name].filter(Boolean).join(" ");

    const result = await pool.query(
      `INSERT INTO agents (name, username, password_hash, first_name, last_name, email, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, first_name, last_name, email, phone`,
      [
        name,
        username,
        passwordHash,
        first_name,
        last_name || null,
        email || null,
        phone || null,
      ],
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, username: user.username });
    await setAuthCookie(token);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
