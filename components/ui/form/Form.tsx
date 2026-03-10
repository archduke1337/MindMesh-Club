// components/ui/form/Form.tsx
"use client";

import type { FormHTMLAttributes, ReactNode } from "react";

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
}

/**
 * Thin `<form>` wrapper with consistent spacing.
 * All forms in the app should use this so `Enter` key submission
 * and native autofill work reliably.
 */
export function Form({ children, className, ...rest }: FormProps) {
  return (
    <form className={`flex flex-col gap-4 ${className ?? ""}`} {...rest}>
      {children}
    </form>
  );
}
