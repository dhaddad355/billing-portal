import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected page routes (from route group (portal))
const PROTECTED_PAGE_ROUTES = [
  "/dashboard",
  "/referrals",
  "/statements",
  "/statements-processing",
  "/settings",
];

// Protected API routes (from route group (portal))
const PROTECTED_API_ROUTES = [
  "/api/practices",
  "/api/providers",
  "/api/referrals",
  "/api/statements",
  "/api/settings",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected page route
  const isProtectedPage = PROTECTED_PAGE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedPage) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Check if this is a protected API route
  const isProtectedApi = PROTECTED_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedApi) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/referrals/:path*",
    "/statements/:path*",
    "/statements-processing/:path*",
    "/settings/:path*",
    "/api/practices/:path*",
    "/api/providers/:path*",
    "/api/referrals/:path*",
    "/api/statements/:path*",
    "/api/settings/:path*",
  ],
};
