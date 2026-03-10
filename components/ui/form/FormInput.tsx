// components/ui/form/FormInput.tsx
"use client";

import { Input, type InputProps } from "@heroui/input";
import { forwardRef } from "react";
import { FORM_DEFAULTS } from "./defaults";

export type FormInputProps = InputProps;

/**
 * Standard text input — wraps HeroUI `Input` with consistent
 * `variant="bordered"`, classNames, and a11y defaults.
 *
 * Accepts all HeroUI InputProps. Override any default by passing
 * the prop explicitly (e.g. `variant="flat"`).
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (props, ref) => {
    const { classNames, ...rest } = props;
    return (
      <Input
        {...FORM_DEFAULTS}
        classNames={{ ...FORM_DEFAULTS.classNames, ...classNames }}
        ref={ref}
        {...rest}
      />
    );
  }
);

FormInput.displayName = "FormInput";
