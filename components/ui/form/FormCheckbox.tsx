// components/ui/form/FormCheckbox.tsx
"use client";

import { Checkbox, type CheckboxProps } from "@heroui/checkbox";

export type FormCheckboxProps = CheckboxProps;

/**
 * Standard checkbox — wraps HeroUI Checkbox.
 * Replaces raw `<input type="checkbox">` for visual and a11y consistency.
 */
export function FormCheckbox(props: FormCheckboxProps) {
  return <Checkbox {...props} />;
}
