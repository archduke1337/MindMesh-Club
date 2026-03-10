// components/events/DynamicRegistrationForm.tsx
// ═══════════════════════════════════════════════════════
// Renders registration fields dynamically based on
// the event type's config. Handles conditional visibility,
// field types, and validation.
// ═══════════════════════════════════════════════════════
"use client";

import { useState, useMemo } from "react";
import { FormInput, FormTextarea, FormSelect, FormCheckbox } from "@/components/ui/form";
import { SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { EventType, FieldDefinition } from "@/lib/events/types";
import { getEventTypeConfig } from "@/lib/events/registry";

interface DynamicRegistrationFormProps {
  eventType: EventType;
  eventTitle: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isSubmitting?: boolean;
  registrationModel?: string;
}

export default function DynamicRegistrationForm({
  eventType,
  eventTitle,
  onSubmit,
  isSubmitting = false,
  registrationModel,
}: DynamicRegistrationFormProps) {
  const config = getEventTypeConfig(eventType);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter fields that should be visible based on conditional logic
  const visibleFields = useMemo(() => {
    return config.registration.extraFields.filter((field) => {
      if (!field.showWhen) return true;
      return formData[field.showWhen.field] === field.showWhen.value;
    });
  }, [config.registration.extraFields, formData]);

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of visibleFields) {
      if (field.required) {
        const value = formData[field.name];
        if (value === undefined || value === null || value === "") {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit(formData);
  };

  // Model-specific header
  const modelLabels: Record<string, { label: string; color: "primary" | "secondary" | "success" | "warning" }> = {
    team: { label: "Team Registration", color: "primary" },
    individual: { label: "Individual Registration", color: "success" },
    application: { label: "Application Form", color: "warning" },
    rsvp: { label: "RSVP", color: "secondary" },
    dual: { label: "Registration", color: "primary" },
    "fest-pass": { label: "Fest Pass Registration", color: "primary" },
    rolling: { label: "Join Challenge", color: "success" },
  };

  const model = registrationModel || config.registration.model;
  const modelInfo = modelLabels[model] || { label: "Register", color: "primary" as const };

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{modelInfo.label}</h3>
          <Chip size="sm" color={modelInfo.color} variant="flat">
            {config.label}
          </Chip>
        </div>
        <p className="text-sm text-default-500">{eventTitle}</p>
        {config.registration.requiresApproval && (
          <p className="text-xs text-warning">
            ⚠ This requires approval. You&apos;ll be notified once reviewed.
          </p>
        )}
      </CardHeader>
      <CardBody className="gap-4">
        {visibleFields.length === 0 && (
          <p className="text-sm text-default-400">
            No additional information needed. Click below to {model === "rsvp" ? "RSVP" : "register"}.
          </p>
        )}

        {visibleFields.map((field) => renderField(field, formData, handleChange, errors[field.name]))}

        <Button
          color="primary"
          size="lg"
          className="w-full"
          onPress={handleSubmit}
          isLoading={isSubmitting}
        >
          {model === "rsvp"
            ? "Confirm RSVP"
            : model === "application"
              ? "Submit Application"
              : model === "rolling"
                ? "Join Challenge"
                : "Register Now"}
        </Button>
      </CardBody>
    </Card>
  );
}

// ── Field Renderer ──────────────────────────────────────

function renderField(
  field: FieldDefinition,
  formData: Record<string, unknown>,
  onChange: (name: string, value: unknown) => void,
  error?: string
) {
  const key = field.name;
  const value = formData[key];

  switch (field.type) {
    case "text":
    case "url":
    case "number":
      return (
        <FormInput
          key={key}
          label={field.label}
          placeholder={field.placeholder}
          type={field.type === "url" ? "url" : field.type === "number" ? "number" : "text"}
          value={(value as string) || ""}
          onValueChange={(v) => onChange(key, field.type === "number" ? Number(v) : v)}
          isRequired={field.required}
          isInvalid={!!error}
          errorMessage={error}
          description={field.helpText}
        />
      );

    case "textarea":
      return (
        <FormTextarea
          key={key}
          label={field.label}
          placeholder={field.placeholder}
          value={(value as string) || ""}
          onValueChange={(v) => onChange(key, v)}
          isRequired={field.required}
          isInvalid={!!error}
          errorMessage={error}
          description={field.helpText}
          minRows={3}
        />
      );

    case "select":
      return (
        <FormSelect
          key={key}
          label={field.label}
          placeholder={field.placeholder || `Select ${field.label}`}
          selectedKeys={value ? new Set([value as string]) : new Set()}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0];
            onChange(key, selected);
          }}
          isRequired={field.required}
          isInvalid={!!error}
          errorMessage={error}
          description={field.helpText}
        >
          {(field.options || []).map((opt) => (
            <SelectItem key={opt.value}>{opt.label}</SelectItem>
          ))}
        </FormSelect>
      );

    case "multiselect":
      return (
        <FormSelect
          key={key}
          label={field.label}
          placeholder={field.placeholder || `Select ${field.label}`}
          selectionMode="multiple"
          selectedKeys={new Set((value as string[]) || [])}
          onSelectionChange={(keys) => {
            onChange(key, Array.from(keys));
          }}
          isRequired={field.required}
          isInvalid={!!error}
          errorMessage={error}
          description={field.helpText}
        >
          {(field.options || []).map((opt) => (
            <SelectItem key={opt.value}>{opt.label}</SelectItem>
          ))}
        </FormSelect>
      );

    case "checkbox":
      return (
        <div key={key}>
          <FormCheckbox
            isSelected={(value as boolean) || false}
            onValueChange={(v) => onChange(key, v)}
          >
            {field.label}
          </FormCheckbox>
          {field.helpText && (
            <p className="text-xs text-default-400 ml-7">{field.helpText}</p>
          )}
        </div>
      );

    case "date":
      return (
        <FormInput
          key={key}
          label={field.label}
          type="date"
          value={(value as string) || ""}
          onValueChange={(v) => onChange(key, v)}
          isRequired={field.required}
          isInvalid={!!error}
          errorMessage={error}
          description={field.helpText}
        />
      );

    default:
      return null;
  }
}
