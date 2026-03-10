// components/ui/form/FormTextarea.tsx
"use client";

import { Textarea, type TextAreaProps } from "@heroui/input";
import { FORM_DEFAULTS } from "./defaults";

export type FormTextareaProps = TextAreaProps;

/**
 * Standard textarea — wraps HeroUI Textarea with consistent defaults.
 */
export function FormTextarea({ classNames, ...rest }: FormTextareaProps) {
  return (
    <Textarea
      {...FORM_DEFAULTS}
      classNames={{ ...FORM_DEFAULTS.classNames, ...classNames }}
      {...rest}
    />
  );
}
