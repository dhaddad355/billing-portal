import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected page routes (from route group (portal))
const protectedPageRoutes = [
  "/dashboard",
  "/statements-processing",
  "/statements",
  "/open-statements",
  "/referrals",
  "/settings",
];

// Protected API routes (from route group (portal))
const protectedApiRoutes = [
  "/api/practices",
  "/api/providers",
  "/api/referrals",
  "/api/settings",
  "/api/statements",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected page route
  const isProtectedPage = protectedPageRoutes.some(
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
  const isProtectedApi = protectedApiRoutes.some(
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
    "/statements-processing/:path*",
    "/statements/:path*",
    "/open-statements/:path*",
    "/referrals/:path*",
    "/settings/:path*",
    "/api/practices/:path*",
    "/api/providers/:path*",
    "/api/referrals/:path*",
    "/api/settings/:path*",
    "/api/statements/:path*",
  ],
};
