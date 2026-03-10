// components/ui/form/FormSelect.tsx
"use client";

import { Select, type SelectProps } from "@heroui/select";
import { forwardRef } from "react";
import { FORM_DEFAULTS } from "./defaults";

export type FormSelectProps = SelectProps;

/**
 * Standard select — wraps HeroUI Select with consistent defaults.
 * Pass `<SelectItem>` children normally (no `variant` needed on items).
 */
export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (props, ref) => {
    const { classNames, ...rest } = props;
    return (
      <Select
        {...FORM_DEFAULTS}
        classNames={{ ...FORM_DEFAULTS.classNames, ...classNames }}
        ref={ref}
        {...rest}
      />
    );
  }
);

FormSelect.displayName = "FormSelect";
