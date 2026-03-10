// components/ui/form/FormTextarea.tsx
"use client";

import { Textarea, type TextAreaProps } from "@heroui/input";
import { forwardRef } from "react";
import { FORM_DEFAULTS } from "./defaults";

export type FormTextareaProps = TextAreaProps;

/**
 * Standard textarea — wraps HeroUI Textarea with consistent defaults.
 */
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (props, ref) => {
    const { classNames, ...rest } = props;
    return (
      <Textarea
        {...FORM_DEFAULTS}
        classNames={{ ...FORM_DEFAULTS.classNames, ...classNames }}
        ref={ref}
        {...rest}
      />
    );
  }
);

FormTextarea.displayName = "FormTextarea";
