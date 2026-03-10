// app/api/auth/oauth/route.ts
/**
 * Server-side OAuth token → session exchange.
 * Receives the userId + OAuth token from the callback page,
 * creates a session server-side (so we get the secret),
 * and stores it in an httpOnly cookie on our domain.
 */
import { NextRequest, NextResponse } from "next/server";
import { adminAccount } from "@/lib/appwrite/server";

const COOKIE_NAME = "appwrite-session";
const MAX_AGE = 60 * 60 * 24 * 365;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export async function POST(request: NextRequest) {
  try {
    const { userId, secret } = await request.json();
    if (!userId || !secret) {
      return NextResponse.json(
        { error: "userId and secret are required" },
        { status: 400 }
      );
    }

    // Exchange the OAuth token for a session (server-side → returns secret)
    const session = await adminAccount.createSession(userId, secret);

    const response = NextResponse.json({
      success: true,
      secret: session.secret,
    });
    response.cookies.set(COOKIE_NAME, session.secret, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: "strict",
      path: "/",
      maxAge: MAX_AGE,
    });
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "OAuth session exchange failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
