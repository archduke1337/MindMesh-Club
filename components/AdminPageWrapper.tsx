// components/AdminPageWrapper.tsx
/**
 * Wrapper component for all admin pages.
 * Provides consistent page header and layout.
 * Auth is handled by AdminAuthGuard in app/admin/layout.tsx and
 * Edge Middleware — no duplicate auth checks needed here.
 */

"use client";

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
