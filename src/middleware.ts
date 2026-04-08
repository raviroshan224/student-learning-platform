import { NextRequest, NextResponse } from "next/server";

// Routes accessible without authentication
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Next.js internals and API proxy pass through untouched
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isAuthenticated = request.cookies.has("auth_session");
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  // Authenticated user visiting landing page or auth pages → go to dashboard
  if (isAuthenticated && isPublicRoute && pathname !== "/select-categories") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Guest visiting any protected page → redirect to login, preserving destination
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
