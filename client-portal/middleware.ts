import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "portal_session";

async function isValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const isProtectedApi =
    req.nextUrl.pathname.startsWith("/api/tasks") ||
    req.nextUrl.pathname.startsWith("/api/requests") ||
    req.nextUrl.pathname.startsWith("/api/documents");

  if (req.nextUrl.pathname.startsWith("/dashboard") || isProtectedApi) {
    const valid = await isValidSession(req);
    if (!valid) {
      if (isProtectedApi) {
        return NextResponse.json({ error: "Not signed in." }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/tasks/:path*", "/api/requests/:path*", "/api/documents/:path*"]
};
