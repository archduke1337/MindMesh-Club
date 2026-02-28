// lib/apiAuth.ts
/**
 * Shared server-side authentication & authorization middleware for API routes.
 * Extracts the session from the Appwrite cookie and verifies admin status.
 *
 * Usage in any API route:
 *   import { verifyAuth, verifyAdmin } from "@/lib/apiAuth";
 *   const { authenticated, user, error } = await verifyAuth(request);
 *   const { isAdmin, user, error } = await verifyAdmin(request);
 */
import { NextRequest } from "next/server";
import { isUserAdminByEmail } from "./adminConfig";

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
 * Verify that the request comes from an authenticated user via session cookie.
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return { authenticated: false, error: "Not authenticated — no session cookie" };
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    if (!endpoint || !projectId) {
      return { authenticated: false, error: "Server misconfiguration" };
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
 * Checks both Appwrite labels and email-based admin config.
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminResult> {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated || !authResult.user) {
    return { isAdmin: false, error: authResult.error || "Not authenticated" };
  }

  const user = authResult.user;
  const hasAdminLabel = user.labels?.includes("admin") ?? false;
  const hasAdminEmail = isUserAdminByEmail(user.email);

  if (!hasAdminLabel && !hasAdminEmail) {
    return { isAdmin: false, user, error: "Not authorized — admin access required" };
  }

  return { isAdmin: true, user };
}
