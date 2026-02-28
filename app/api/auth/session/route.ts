// app/api/auth/session/route.ts
/**
 * Session cookie synchronisation endpoint.
 *
 * POST — stores the Appwrite session secret in an httpOnly cookie
 *         on our own domain so that Edge Middleware can read it.
 * DELETE — clears the cookie (called on logout).
 */
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "appwrite-session";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year (Appwrite sessions are long-lived)

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();
    if (!secret || typeof secret !== "string") {
      return NextResponse.json(
        { error: "Missing session secret" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });
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
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
