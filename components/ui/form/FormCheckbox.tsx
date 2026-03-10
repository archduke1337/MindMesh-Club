// components/ui/form/FormCheckbox.tsx
"use client";

import { Checkbox, type CheckboxProps } from "@heroui/checkbox";
import { forwardRef } from "react";

export type FormCheckboxProps = CheckboxProps;

/**
 * Standard checkbox — wraps HeroUI Checkbox.
 * Replaces raw `<input type="checkbox">` for visual and a11y consistency.
 */
export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  (props, ref) => <Checkbox ref={ref} {...props} />
);

FormCheckbox.displayName = "FormCheckbox";
