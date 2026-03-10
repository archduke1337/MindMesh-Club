// components/ui/form/FormPasswordInput.tsx
"use client";

import { useState, forwardRef } from "react";
import { Input, type InputProps } from "@heroui/input";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { FORM_DEFAULTS } from "./defaults";

export interface FormPasswordInputProps
  extends Omit<InputProps, "type" | "endContent"> {
  /** Override the visibility‐toggle icons. */
  showIcon?: React.ReactNode;
  hideIcon?: React.ReactNode;
}

/**
 * Password input with built-in show/hide toggle.
 * Wraps HeroUI Input with all standard form defaults.
 */
export const FormPasswordInput = forwardRef<
  HTMLInputElement,
  FormPasswordInputProps
>(({ showIcon, hideIcon, classNames, ...rest }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...FORM_DEFAULTS}
      classNames={{ ...FORM_DEFAULTS.classNames, ...classNames }}
      type={visible ? "text" : "password"}
      endContent={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="focus:outline-none"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible
            ? (hideIcon ?? <EyeOffIcon className="w-4 h-4 text-default-400" />)
            : (showIcon ?? <EyeIcon className="w-4 h-4 text-default-400" />)}
        </button>
      }
      ref={ref}
      {...rest}
    />
  );
});

FormPasswordInput.displayName = "FormPasswordInput";
