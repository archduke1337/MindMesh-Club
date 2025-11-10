// components/AdminPageWrapper.tsx
/**
 * Wrapper component for all admin pages
 * Provides authentication, error boundaries, and consistent UI
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isUserAdminByEmail } from "@/lib/adminConfig";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface AdminPageWrapperProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function AdminPageWrapper({
  children,
  title,
  description,
}: AdminPageWrapperProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Check authentication
      if (!user) {
        setError("Not authenticated. Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      // Check admin status using email
      if (!isUserAdminByEmail(user.email)) {
        setError("You do not have permission to access this page.");
        setTimeout(() => router.push("/"), 3000);
        return;
      }

      setIsAdmin(true);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-default-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6">
        <Card className="border-none shadow-lg border-l-4 border-danger">
          <CardBody className="gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-danger flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-danger">{error}</h3>
                <p className="text-sm text-default-500 mt-1">
                  {!user
                    ? "Please log in to access admin pages."
                    : "Contact an administrator if you believe this is an error."}
                </p>
              </div>
            </div>
            <Button
              variant="flat"
              color="danger"
              startContent={<ArrowLeft className="w-4 h-4" />}
              onPress={() => router.push("/")}
            >
              Go Back
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6">
      {/* Page Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="text-default-500 mt-1 md:mt-2 text-sm md:text-base">
            {description}
          </p>
        )}
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
