import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login"];
const PUBLIC_PREFIXES = ["/api/auth", "/_next", "/favicon.ico", "/images", "/fonts"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Always allow public prefixes (static files, NextAuth callbacks)
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Always allow exact public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const session = req.auth;

  // Unauthenticated — redirect to /login (or 401 for API routes)
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated — if they visit /login send them to dashboard
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files with extensions
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
