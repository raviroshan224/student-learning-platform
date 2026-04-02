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
];

// Routes that an already-authenticated user should not visit
const AUTH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read both possible auth signals:
  //   • auth_session — set by client-side code immediately after login
  //   • refresh_token — set as httpOnly by the backend on login (if applicable)
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
    // Always send to dashboard — client-side code handles the
    // select-categories redirect if hasSelectedCategories is false
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// !! IMPORTANT: exclude /api/ routes so the proxy handler itself is never
//    intercepted by this middleware, preventing infinite loops.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};
