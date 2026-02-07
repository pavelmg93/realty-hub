import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("promemo_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Basic JWT structure check (full verification happens in API routes)
  const parts = token.split(".");
  if (parts.length !== 3) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
