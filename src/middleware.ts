import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, isAuthenticatedRequest } from "@/lib/auth";

const AUTH_ROUTES = ["/login", "/signup"];
const PROTECTED_PREFIXES = ["/dashboard", "/vault", "/mind"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = isAuthenticatedRequest(authCookie);

  if (pathname === "/") {
    const destination = isAuthenticated ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (AUTH_ROUTES.some((route) => pathname.startsWith(route)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) &&
    !isAuthenticated
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard", "/vault/:path*", "/mind"],
};
