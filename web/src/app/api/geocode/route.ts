import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    // Use Nominatim for geocoding (free, rate-limited to 1 req/sec)
    const query = `${q}, Nha Trang, Khanh Hoa, Vietnam`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "ProMemo/1.0 (Real Estate Agent Platform)",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 502 },
      );
    }

    const results = await res.json();

    const locations = results.map(
      (r: { lat: string; lon: string; display_name: string }) => ({
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
        display_name: r.display_name,
      }),
    );

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json(
      { error: "Geocoding failed" },
      { status: 500 },
    );
  }
}
