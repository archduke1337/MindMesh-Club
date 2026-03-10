// lib/events/registration/schemas.ts
// ═══════════════════════════════════════════════════════
// Per-model Zod validation schemas for registration
// ═══════════════════════════════════════════════════════

import { z } from "zod";

// ── Base schema — common to all models ──────────────────

const baseSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  userId: z.string().min(1, "User ID is required"),
  userName: z.string().min(2).max(100),
  userEmail: z.string().email(),
  userPhone: z.string().optional(),
});

// ── Individual ──────────────────────────────────────────

export const individualSchema = baseSchema.extend({
  extraFields: z.record(z.unknown()).optional(),
});

// ── Team creation ───────────────────────────────────────

export const teamCreateSchema = baseSchema.extend({
  teamName: z
    .string()
    .min(2, "Team name must be at least 2 characters")
    .max(50, "Team name must be less than 50 characters"),
  teamDescription: z.string().max(500).optional(),
  maxSize: z.number().int().min(1).max(20).optional(),
});

// ── Team join ───────────────────────────────────────────

export const teamJoinSchema = baseSchema.extend({
  inviteCode: z
    .string()
    .min(4, "Invalid invite code")
    .max(20, "Invalid invite code"),
});

// ── Application ─────────────────────────────────────────

export const applicationSchema = baseSchema.extend({
  applicationData: z.record(z.unknown()),
});

// ── RSVP ────────────────────────────────────────────────

export const rsvpSchema = baseSchema.extend({
  extraFields: z.record(z.unknown()).optional(),
});

// ── Dual (exhibition) ───────────────────────────────────

export const dualSchema = baseSchema.extend({
  registrationType: z.enum(["exhibitor", "visitor"]),
  applicationData: z.record(z.unknown()).optional(),
});

// ── Fest Pass ───────────────────────────────────────────

export const festPassSchema = baseSchema.extend({
  tier: z.string().optional(),
  college: z.string().min(2).max(200).optional(),
  yearOfStudy: z.string().optional(),
  branch: z.string().max(100).optional(),
  extraFields: z.record(z.unknown()).optional(),
});

// ── Rolling ─────────────────────────────────────────────

export const rollingSchema = baseSchema.extend({
  extraFields: z.record(z.unknown()).optional(),
});

// ── Schema map by registration model ────────────────────

export const REGISTRATION_SCHEMAS = {
  individual: individualSchema,
  team: teamCreateSchema,
  "team-join": teamJoinSchema,
  application: applicationSchema,
  rsvp: rsvpSchema,
  dual: dualSchema,
  "fest-pass": festPassSchema,
  rolling: rollingSchema,
} as const;

export type RegistrationSchemaKey = keyof typeof REGISTRATION_SCHEMAS;
