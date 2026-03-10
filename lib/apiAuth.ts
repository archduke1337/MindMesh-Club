// lib/apiAuth.ts
/**
 * Shared server-side authentication & authorization middleware for API routes.
 *
 * Uses a unified cookie strategy:
 *  - Reads the `appwrite-session` httpOnly cookie (set by /api/auth/session)
 *  - Constructs the Appwrite session cookie and validates against Appwrite
 *
 * Falls back to raw browser cookies (Appwrite SDK sets its own cookies)
 * so client-side SDK sessions also work for non-admin routes.
 *
 * Usage:
 *   import { verifyAuth, verifyAdminAuth } from "@/lib/apiAuth";
 *   const { authenticated, user, error } = await verifyAuth(request);
 *   const { isAdmin, user, error } = await verifyAdminAuth(request);
 */
import { NextRequest } from "next/server";

export interface AuthResult {
  authenticated: boolean;
  user?: { $id: string; email: string; name: string; labels?: string[] };
  error?: string;
}

export interface AdminResult {
  isAdmin: boolean;
  user?: { $id: string; email: string; name: string; labels?: string[] };
  error?: string;
}

/**
 * Verify that the request comes from an authenticated Appwrite user.
 *
 * Strategy:
 *  1. Try the `appwrite-session` httpOnly cookie first (set by our session sync).
 *  2. Fall back to raw browser cookies (Appwrite SDK's own cookies).
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    if (!endpoint || !projectId) {
      return { authenticated: false, error: "Server misconfiguration" };
    }

    // 1. Prefer the httpOnly appwrite-session cookie (works for all routes)
    const sessionSecret = request.cookies.get("appwrite-session")?.value;
    let cookieHeader: string | null = null;

    if (sessionSecret) {
      cookieHeader = `a_session_${projectId}=${sessionSecret}`;
    } else {
      // 2. Fall back to raw browser cookies (Appwrite SDK's own cookies)
      cookieHeader = request.headers.get("cookie");
    }

    if (!cookieHeader) {
      return { authenticated: false, error: "Not authenticated — no session cookie" };
    }

    const res = await fetch(`${endpoint}/account`, {
      headers: {
        "X-Appwrite-Project": projectId,
        Cookie: cookieHeader,
      },
    });

    if (!res.ok) {
      return { authenticated: false, error: "Not authenticated — invalid session" };
    }

    const user = await res.json();
    return {
      authenticated: true,
      user: {
        $id: user.$id,
        email: user.email,
        name: user.name,
        labels: user.labels,
      },
    };
  } catch {
    return { authenticated: false, error: "Authentication check failed" };
  }
}

/**
 * Verify that the request comes from an authenticated admin user.
 * Checks Appwrite labels ONLY — always validates against Appwrite.
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminResult> {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated || !authResult.user) {
    return { isAdmin: false, error: authResult.error || "Not authenticated" };
  }

  const user = authResult.user;
  const hasAdminLabel = user.labels?.includes("admin") ?? false;

  if (!hasAdminLabel) {
    return { isAdmin: false, user, error: "Not authorized — admin access required" };
  }

  return { isAdmin: true, user };
}
