// app/api/auth/login/route.ts
/**
 * Server-side email/password login.
 * Uses node-appwrite to create the session so we get the session secret,
 * then stores it in an httpOnly cookie on our domain.
 */
import { NextRequest, NextResponse } from "next/server";
import { adminAccount } from "@/lib/appwrite/server";

const COOKIE_NAME = "appwrite-session";
const MAX_AGE = 60 * 60 * 24 * 365;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const session = await adminAccount.createEmailPasswordSession(email, password);

    const response = NextResponse.json({ success: true, secret: session.secret });
    response.cookies.set(COOKIE_NAME, session.secret, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: "strict",
      path: "/",
      maxAge: MAX_AGE,
    });
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
