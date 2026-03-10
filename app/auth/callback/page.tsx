// app/auth/callback/page.tsx
"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { account } from "@/lib/appwrite";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleOAuthCallback() {
      const userId = searchParams.get("userId");
      const secret = searchParams.get("secret");

      if (!userId || !secret) {
        // No token params — likely a stale navigation
        window.location.href = "/login";
        return;
      }

      try {
        // Exchange the single-use OAuth token for a session
        const session = await account.createSession(userId, secret);

        // Sync session secret to our httpOnly cookie
        if (session?.secret) {
          const res = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secret: session.secret }),
          });
          if (!res.ok) {
            throw new Error("Failed to sync session cookie");
          }
        }

        // Full reload to pick up the new session in AuthContext
        window.location.href = "/";
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Authentication failed";
        console.error("OAuth callback error:", message);
        setError(message);
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    }

    handleOAuthCallback();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-danger text-lg">Authentication failed</p>
          <p className="mt-2 text-default-500">{error}</p>
          <p className="mt-2 text-sm text-default-400">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-default-500">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-default-500">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}