import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await request.json().catch(() => ({ url: "" }));
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // Only allow resolving Google Maps short links
  if (!url.includes("goo.gl") && !url.includes("maps.app")) {
    return NextResponse.json({ error: "Only Google Maps short links are supported" }, { status: 400 });
  }

  try {
    // Follow redirects to get the final URL
    const res = await fetch(url, { redirect: "follow" });
    return NextResponse.json({ resolvedUrl: res.url });
  } catch {
    return NextResponse.json({ error: "Failed to resolve URL" }, { status: 500 });
  }
}
