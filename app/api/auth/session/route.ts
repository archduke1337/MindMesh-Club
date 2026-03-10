// app/api/auth/session/route.ts
/**
 * Session cookie synchronisation endpoint.
 *
 * POST — validates the Appwrite session secret, then stores it in an
 *         httpOnly cookie on our domain so Edge Middleware can read it.
 * DELETE — clears the cookie (called on logout).
 */
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "appwrite-session";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year (Appwrite sessions are long-lived)
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();
    if (!secret || typeof secret !== "string") {
      return NextResponse.json(
        { error: "Missing session secret" },
        { status: 400 }
      );
    }

    // Validate the secret against Appwrite before storing it
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    if (!endpoint || !projectId) {
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const appwriteCookie = `a_session_${projectId}=${secret}`;
    const verifyRes = await fetch(`${endpoint}/account`, {
      headers: {
        "X-Appwrite-Project": projectId,
        Cookie: appwriteCookie,
      },
    });

    if (!verifyRes.ok) {
      return NextResponse.json(
        { error: "Invalid session secret" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, secret, cookieOptions(MAX_AGE));
    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", cookieOptions(0));
  return response;
}
