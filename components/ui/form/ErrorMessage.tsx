// components/ui/form/ErrorMessage.tsx
"use client";

interface ErrorMessageProps {
  message?: string | null;
  className?: string;
}

/**
 * Form-level error banner (e.g. "Invalid credentials").
 * For field-level errors, use `isInvalid` + `errorMessage` on HeroUI inputs.
 */
export function ErrorMessage({ message, className }: ErrorMessageProps) {
  if (!message) return null;
  return (
    <div
      className={`text-danger text-xs sm:text-small bg-danger/10 p-2 md:p-3 rounded ${className ?? ""}`}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
