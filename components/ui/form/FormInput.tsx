// components/ui/form/FormInput.tsx
"use client";

import { Input, type InputProps } from "@heroui/input";
import { FORM_DEFAULTS } from "./defaults";

export type FormInputProps = InputProps;

/**
 * Standard text input — wraps HeroUI `Input` with consistent
 * `variant="bordered"`, classNames, and a11y defaults.
 *
 * Accepts all HeroUI InputProps. Override any default by passing
 * the prop explicitly (e.g. `variant="flat"`).
 */
export function FormInput({ classNames, ...rest }: FormInputProps) {
  return (
    <Input
      {...FORM_DEFAULTS}
      classNames={{ ...FORM_DEFAULTS.classNames, ...classNames }}
      {...rest}
    />
  );
}
