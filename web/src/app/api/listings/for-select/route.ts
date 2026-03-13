import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";

/**
 * Returns listings for CRM dropdown: current user's listings plus feed listings.
 * Use for person-listing association and deal listing association.
 * Query params: source=mine|feed|both (default both), q= search (ward, street, id), limit=
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || "both";
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const results: Array<{
      id: number;
      ward: string | null;
      street: string | null;
      price_vnd: number | null;
      property_type: string | null;
      area_m2: number | null;
      status: string;
      source: "mine" | "feed";
    }> = [];

    if (source === "mine" || source === "both") {
      const mine = await pool.query(
        `SELECT id, ward, street, price_vnd, property_type, area_m2, status
         FROM parsed_listings
         WHERE agent_id = $1 AND archived_at IS NULL
         ORDER BY updated_at DESC
         LIMIT $2`,
        [auth.userId, limit],
      );
      mine.rows.forEach((r) => results.push({ ...r, source: "mine" }));
    }

    if (source === "feed" || source === "both") {
      const feed = await pool.query(
        `SELECT pl.id, pl.ward, pl.street, pl.price_vnd, pl.property_type, pl.area_m2, pl.status
         FROM parsed_listings pl
         WHERE pl.archived_at IS NULL
         ORDER BY pl.updated_at DESC
         LIMIT $1`,
        [limit],
      );
      const seen = new Set(results.map((r) => r.id));
      feed.rows.forEach((r) => {
        if (!seen.has(r.id)) {
          seen.add(r.id);
          results.push({ ...r, source: "feed" as const });
        }
      });
    }

    let list = results;
    if (q) {
      list = results.filter((l) => {
        const label = [
          String(l.id),
          l.ward || "",
          l.street || "",
          l.property_type || "",
        ].join(" ").toLowerCase();
        return label.includes(q);
      });
    }

    return NextResponse.json({ listings: list });
  } catch (error) {
    console.error("Listings for-select error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
