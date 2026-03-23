import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth";

const publicRoutes = ["/", "/login", "/register", "/portfolio"];
const authRoutes = ["/login", "/register"];
const apiAuthRoutes = ["/api/auth"];
const publicApiRoutes = ["/api/public"];

// Simple in-memory rate limit (per-IP, resets on deploy)
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // requests per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

export default auth((req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const session = (req as unknown as { auth: { user?: { id: string } } | null }).auth;
  const isAuthenticated = !!session?.user;

  // Rate limiting for API routes
  if (pathname.startsWith("/api")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "RATE_LIMITED", message: "Too many requests" },
        },
        { status: 429 },
      );
    }

    // Allow public API and auth routes
    if (
      apiAuthRoutes.some((r) => pathname.startsWith(r)) ||
      publicApiRoutes.some((r) => pathname.startsWith(r))
    ) {
      return NextResponse.next();
    }

    // Require auth for other API routes
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 },
      );
    }

    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Allow public routes
  if (publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return NextResponse.next();
  }

  // Require auth for everything else (dashboard, settings, etc.)
  if (!isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, req.url),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|images|fonts).*)",
  ],
};
