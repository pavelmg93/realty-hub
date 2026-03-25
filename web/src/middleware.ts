import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getRateLimitKey,
  DEFAULT_RATE_LIMIT,
  AUTH_RATE_LIMIT,
  AI_RATE_LIMIT,
  UPLOAD_RATE_LIMIT,
} from "@/lib/rate-limit";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    let config = DEFAULT_RATE_LIMIT;
    let prefix = "api";

    if (pathname.startsWith("/api/auth/")) {
      config = AUTH_RATE_LIMIT;
      prefix = "auth";
    } else if (pathname.startsWith("/api/ai/")) {
      config = AI_RATE_LIMIT;
      prefix = "ai";
    } else if (pathname.startsWith("/api/upload")) {
      config = UPLOAD_RATE_LIMIT;
      prefix = "upload";
    }

    const key = getRateLimitKey(request, prefix);
    const result = checkRateLimit(key, config);

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(result.resetMs / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    return response;
  }

  // Dashboard auth check
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("realtyhub_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Basic JWT structure check (full verification happens in API routes)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
