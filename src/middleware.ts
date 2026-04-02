import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require the user to be authenticated
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/courses",
  "/exams",
  "/live",
  "/profile",
  "/checkout",
  "/notifications",
  "/test",
  "/select-categories",
  // NOTE: /explore is intentionally public — anyone can browse courses
];

// Routes that an already-authenticated user should not visit
const AUTH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated =
    request.cookies.has("auth_session") ||
    request.cookies.has("refresh_token");

  // ── 1. Unauthenticated user tries to access a protected route ──────────────
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 2. Already-authenticated user visits an auth page ─────────────────────
  const isAuthPage = AUTH_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};
