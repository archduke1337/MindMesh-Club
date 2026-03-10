// app/api/auth/register/route.ts
/**
 * Server-side account registration + auto-login.
 * Creates the Appwrite account and session server-side so we get the secret,
 * then stores it in an httpOnly cookie on our domain.
 */
import { NextRequest, NextResponse } from "next/server";
import { adminAccount, ID } from "@/lib/appwrite/server";

const COOKIE_NAME = "appwrite-session";
const MAX_AGE = 60 * 60 * 24 * 365;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Create the account
    await adminAccount.create(ID.unique(), email, password, name);

    // Create a session so we get the secret
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
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
