// components/ui/form/FormField.tsx
"use client";

import type { ReactNode } from "react";

export interface FormFieldProps {
  /** Visible label text. */
  label?: string;
  /** Links the label to this input id. */
  htmlFor?: string;
  /** Renders below the input when there is no error. */
  helperText?: string;
  /** Error message — takes precedence over helperText. */
  error?: string;
  /** Extra className on the wrapper div. */
  className?: string;
  children: ReactNode;
}

/**
 * Generic field wrapper providing:
 *  - linked `<label>` + id
 *  - helper / error text with `aria-live`
 *  - consistent vertical spacing
 *
 * Use this for **non-HeroUI** inputs (raw file inputs, custom widgets).
 * HeroUI Input/Select/Textarea already have built-in labels and error
 * messages — prefer their `label`, `isInvalid`, `errorMessage` props.
 */
export function FormField({
  label,
  htmlFor,
  helperText,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs md:text-small font-medium text-default-700 mb-1.5"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p
          className="text-tiny text-danger mt-1"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : helperText ? (
        <p className="text-tiny text-default-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
