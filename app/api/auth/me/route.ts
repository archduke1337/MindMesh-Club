// app/api/auth/me/route.ts
/**
 * Returns the currently authenticated user from the session cookie.
 * Used by the AuthContext to check authentication state when the
 * client SDK doesn't have a session (e.g. after page reload).
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    if (!endpoint || !projectId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Try our httpOnly cookie first
    const sessionSecret = request.cookies.get("appwrite-session")?.value;
    let cookieHeader: string | null = null;

    if (sessionSecret) {
      cookieHeader = `a_session_${projectId}=${sessionSecret}`;
    } else {
      // Fall back to raw browser cookies (Appwrite SDK's own cookies)
      cookieHeader = request.headers.get("cookie");
    }

    if (!cookieHeader) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const res = await fetch(`${endpoint}/account`, {
      headers: {
        "X-Appwrite-Project": projectId,
        Cookie: cookieHeader,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await res.json();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
