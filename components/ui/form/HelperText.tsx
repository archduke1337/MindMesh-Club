// components/ui/form/HelperText.tsx
"use client";

interface HelperTextProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Static helper text below a field group or form section.
 */
export function HelperText({ children, className }: HelperTextProps) {
  if (!children) return null;
  return (
    <p className={`text-tiny text-default-400 ${className ?? ""}`}>
      {children}
    </p>
  );
}
