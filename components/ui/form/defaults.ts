// components/ui/form/defaults.ts
/**
 * Shared default props for all form components.
 * Single source of truth for variant, classNames, sizing.
 */

/** Standard classNames applied to every HeroUI Input/Textarea/Select. */
export const FORM_CLASSNAMES = {
  input: "text-sm md:text-base",
  label: "text-xs md:text-small",
} as const;

/** Default props spread onto every HeroUI Input/Textarea/Select. */
export const FORM_DEFAULTS = {
  variant: "bordered" as const,
  classNames: FORM_CLASSNAMES,
};
