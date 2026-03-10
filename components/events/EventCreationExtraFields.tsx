// components/events/EventCreationExtraFields.tsx
// ═══════════════════════════════════════════════════════
// Renders extra fields when admin creates/edits an event,
// based on the event type's extraEventFields config.
// These are event-level fields (not registration fields).
// ═══════════════════════════════════════════════════════
"use client";

import { useState, useCallback, useMemo } from "react";
import { FormInput, FormTextarea, FormSelect, FormCheckbox } from "@/components/ui/form";
import { SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { EventType } from "@/lib/events/types";
import { getExtraEventFields } from "@/lib/events/registry";

interface EventCreationExtraFieldsProps {
  eventType: EventType;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
}

export default function EventCreationExtraFields({
  eventType,
  values,
  onChange,
  errors = {},
}: EventCreationExtraFieldsProps) {
  const fields = useMemo(() => getExtraEventFields(eventType), [eventType]);

  if (fields.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-default-600 uppercase tracking-wider">
        {eventType.replace(/-/g, " ")} Configuration
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          // Check conditional visibility
          if (field.showWhen) {
            const depValue = values[field.showWhen.field];
            if (depValue !== field.showWhen.value) return null;
          }

          const fieldError = errors[field.name];
          const value = values[field.name];

          switch (field.type) {
            case "text":
            case "url":
            case "number":
              return (
                <FormInput
                  key={field.name}
                  label={field.label}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  type={field.type}
                  value={String(value ?? "")}
                  isRequired={field.required}
                  isInvalid={!!fieldError}
                  errorMessage={fieldError}
                  onChange={(e) => {
                    const v = field.type === "number"
                      ? Number(e.target.value)
                      : e.target.value;
                    onChange(field.name, v);
                  }}
                />
              );

            case "textarea":
              return (
                <FormTextarea
                  key={field.name}
                  label={field.label}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  value={String(value ?? "")}
                  isRequired={field.required}
                  isInvalid={!!fieldError}
                  errorMessage={fieldError}
                  className="col-span-full"
                  onChange={(e) => onChange(field.name, e.target.value)}
                />
              );

            case "select":
              return (
                <FormSelect
                  key={field.name}
                  label={field.label}
                  placeholder={`Select ${field.label.toLowerCase()}`}
                  selectedKeys={value ? new Set([String(value)]) : new Set()}
                  isRequired={field.required}
                  isInvalid={!!fieldError}
                  errorMessage={fieldError}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    onChange(field.name, selected);
                  }}
                >
                  {(field.options || []).map((opt) => (
                    <SelectItem key={opt.value}>{opt.label}</SelectItem>
                  ))}
                </FormSelect>
              );

            case "multiselect":
              return (
                <FormSelect
                  key={field.name}
                  label={field.label}
                  placeholder={`Select ${field.label.toLowerCase()}`}
                  selectionMode="multiple"
                  selectedKeys={
                    Array.isArray(value) ? new Set(value.map(String)) : new Set()
                  }
                  isRequired={field.required}
                  isInvalid={!!fieldError}
                  errorMessage={fieldError}
                  onSelectionChange={(keys) => {
                    onChange(field.name, Array.from(keys));
                  }}
                >
                  {(field.options || []).map((opt) => (
                    <SelectItem key={opt.value}>{opt.label}</SelectItem>
                  ))}
                </FormSelect>
              );

            case "checkbox":
              return (
                <FormCheckbox
                  key={field.name}
                  isSelected={!!value}
                  onValueChange={(v) => onChange(field.name, v)}
                >
                  {field.label}
                </FormCheckbox>
              );

            case "date":
              return (
                <FormInput
                  key={field.name}
                  label={field.label}
                  type="date"
                  value={String(value ?? "")}
                  isRequired={field.required}
                  isInvalid={!!fieldError}
                  errorMessage={fieldError}
                  onChange={(e) => onChange(field.name, e.target.value)}
                />
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
