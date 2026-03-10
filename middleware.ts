// middleware.ts
/**
 * Next.js Edge Middleware — runs before every matched request.
 *
 * Protects:
 *   /api/admin/*  — requires valid Appwrite session + admin label
 *   /admin/*      — redirects unauthenticated / non-admin users
 *
 * Security:
 *   - Session validation against Appwrite
 *   - Admin authorization via Appwrite labels
 *   - Origin-based CSRF protection for state-changing requests
 */
import { NextRequest, NextResponse } from "next/server";

// ── CSRF Protection ─────────────────────────────────────

/**
 * Origin-based CSRF protection.
 * Rejects state-changing requests whose Origin/Referer doesn't match the host.
 */
function validateOrigin(request: NextRequest): boolean {
  // Safe methods don't need CSRF protection
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return true;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // If no origin header (e.g. same-origin requests from some browsers), check referer
  if (!origin) {
    const referer = request.headers.get("referer");
    if (!referer) {
      // No origin or referer — allow for now (API clients, curl, etc.)
      // API key-based routes have their own auth; cookie-based routes have sameSite=strict
      return true;
    }
    try {
      const refererHost = new URL(referer).host;
      return refererHost === host;
    } catch {
      return false;
    }
  }

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

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

  // ── CSRF Protection (origin-based) ─────────────────
  if (!validateOrigin(request)) {
    return NextResponse.json(
      { error: "Forbidden — cross-origin request rejected" },
      { status: 403 }
    );
  }

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
    // Middleware verified admin — API routes re-verify via verifyAdminAuth()
    // No user info headers are set (defense-in-depth: don't trust headers)
    return NextResponse.next();
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
