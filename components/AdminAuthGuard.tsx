"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Shared auth guard for all admin routes.
 * Redirects unauthenticated users to /login and non-admins to /unauthorized.
 * Uses the unified isAdmin from AuthContext (checks both labels and email).
 */
export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
        return;
      }

      if (!isAdmin) {
        router.push("/unauthorized");
        return;
      }

      setAuthorized(true);
    }
  }, [user, loading, isAdmin, router]);

  if (loading || authorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
