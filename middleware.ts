// middleware.ts
/**
 * Next.js Edge Middleware — runs before every matched request.
 *
 * Protects:
 *   /api/admin/*  — requires valid Appwrite session + admin label
 *   /admin/*      — redirects unauthenticated / non-admin users
 *
 * Public routes are excluded via the `matcher` config below.
 */
import { NextRequest, NextResponse } from "next/server";

// ── Helpers ─────────────────────────────────────────────

async function getSessionUser(request: NextRequest) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) return null;

  // Read our own-domain session cookie (set after login via /api/auth/session)
  const sessionSecret = request.cookies.get("appwrite-session")?.value;
  if (!sessionSecret) return null;

  try {
    // Build the Appwrite session cookie that the API expects
    const appwriteCookie = `a_session_${projectId}=${sessionSecret}`;
    const res = await fetch(`${endpoint}/account`, {
      headers: {
        "X-Appwrite-Project": projectId,
        Cookie: appwriteCookie,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function isAdmin(user: any): boolean {
  if (!user) return false;
  // Admin access via Appwrite "admin" label ONLY
  return user.labels?.includes("admin") ?? false;
}

// ── Middleware handler ──────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin API routes (/api/admin/*) ────────────────
  if (pathname.startsWith("/api/admin")) {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated — no session cookie" },
        { status: 401 }
      );
    }
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Not authorized — admin access required" },
        { status: 403 }
      );
    }
    // Attach user info as request header so route handlers don't need to re-verify
    const res = NextResponse.next();
    res.headers.set("x-user-id", user.$id);
    res.headers.set("x-user-email", user.email);
    res.headers.set("x-user-name", user.name || "");
    res.headers.set("x-user-is-admin", "true");
    return res;
  }

  // ── Admin pages (/admin/*) ─────────────────────────
  if (pathname.startsWith("/admin")) {
    const user = await getSessionUser(request);
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isAdmin(user)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

// ── Matcher — only run middleware on admin paths ────────
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
