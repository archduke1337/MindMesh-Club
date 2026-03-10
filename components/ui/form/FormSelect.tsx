// components/ui/form/FormSelect.tsx
"use client";

import { Select, type SelectProps } from "@heroui/select";
import { FORM_DEFAULTS } from "./defaults";

export type FormSelectProps = SelectProps;

/**
 * Standard select — wraps HeroUI Select with consistent defaults.
 * Pass `<SelectItem>` children normally (no `variant` needed on items).
 */
export function FormSelect({ classNames, ...rest }: FormSelectProps) {
  return (
    <Select
      {...FORM_DEFAULTS}
      classNames={{ ...FORM_DEFAULTS.classNames, ...classNames }}
      {...rest}
    />
  );
}
