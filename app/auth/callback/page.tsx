// app/auth/callback/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { account } from "@/lib/appwrite";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [sessionCreated, setSessionCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleOAuthCallback() {
      // With Appwrite SDK v22+, createOAuth2Token returns userId and secret
      // in the callback URL that must be exchanged for a session
      const userId = searchParams.get("userId");
      const secret = searchParams.get("secret");

      if (userId && secret && !sessionCreated) {
        try {
          await account.createSession(userId, secret);
          setSessionCreated(true);
          // Reload to update auth context with the new session
          window.location.href = "/";
          return;
        } catch (err: any) {
          console.error("Failed to create session from OAuth token:", err);
          setError(err.message || "Authentication failed");
          setTimeout(() => router.push("/login"), 2000);
          return;
        }
      }

      // Fallback: If no token params, check if user is already logged in
      if (!loading) {
        if (user) {
          router.push("/");
        } else if (!userId && !secret) {
          router.push("/login");
        }
      }
    }

    handleOAuthCallback();
  }, [user, loading, router, searchParams, sessionCreated]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-danger text-lg">Authentication failed</p>
          <p className="mt-2 text-default-500">{error}</p>
          <p className="mt-2 text-sm text-default-400">Redirecting to login...</p>
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