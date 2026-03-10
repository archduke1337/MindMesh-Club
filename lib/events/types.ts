// lib/events/types.ts
// ═══════════════════════════════════════════════════════
// Core type definitions for the Event Type-Driven Architecture
// ═══════════════════════════════════════════════════════

import { z } from "zod";

// ── Event Types ─────────────────────────────────────────

export const EVENT_TYPES = [
  "hackathon",
  "competition",
  "workshop",
  "talk",
  "bootcamp",
  "exhibition",
  "social",
  "fest",
  "webinar",
  "drive",
  "challenge",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

// ── Event Status ────────────────────────────────────────

export const EVENT_STATUSES = [
  "draft",
  "published",
  "upcoming",
  "ongoing",
  "completed",
  "cancelled",
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

// ── Capacity Model ──────────────────────────────────────

export type CapacityModel =
  | "per-person"
  | "per-team"
  | "cohort"
  | "dual"       // exhibitors + visitors
  | "flexible"   // soft cap, can overflow
  | "unlimited"
  | "slot-based"  // interview/booth slots
  | "strict";     // hard cap, no overflow

// ── Registration Model ──────────────────────────────────

export type RegistrationModel =
  | "team"
  | "individual"
  | "application"
  | "rsvp"
  | "dual"        // exhibitor + visitor
  | "fest-pass"
  | "rolling";    // async, join anytime

// ── Ticket Template ─────────────────────────────────────

export type TicketTemplate =
  | "team"
  | "individual"
  | "pass"
  | "virtual"
  | "slot"
  | "enrollment"
  | "minimal"
  | "none";

// ── Check-In Model ──────────────────────────────────────

export type CheckInModel =
  | "individual"
  | "team"
  | "daily"
  | "gate"
  | "auto"       // webinar join tracking
  | "none";

// ── Pricing Model ───────────────────────────────────────

export type PricingModel =
  | "per-person"
  | "per-team"
  | "tiered"
  | "free"
  | "free-or-paid"
  | "configurable";

// ── Extra Field Definition ──────────────────────────────
// Defines additional fields collected during registration
// beyond the base (name, email from user profile)

export interface FieldDefinition {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "multiselect" | "checkbox" | "url" | "file" | "date";
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: z.ZodType;
  helpText?: string;
  showWhen?: { field: string; value: string | boolean }; // conditional visibility
}

// ── Feature Flags ───────────────────────────────────────

export interface EventFeatureFlags {
  teams: boolean;
  rounds: boolean;
  submissions: boolean;
  judging: boolean;
  leaderboard: boolean;
  materials: boolean;
  speakers: boolean;
  schedule: boolean;
  certificates: boolean;
  streaming: boolean;
  qna: boolean;
  attendance: boolean;
  mentors: boolean;
  prizes: boolean;
  subEvents: boolean;
  problemStatements: boolean;
  voting: boolean;
  forum: boolean;
}

// ── Post-Event Config ───────────────────────────────────

export interface PostEventConfig {
  hasResults: boolean;
  hasCertificates: boolean;
  hasFeedback: boolean;
  hasGallery: boolean;
  hasRecording: boolean;
  hasResourceSharing: boolean;
}

// ── Team Config ─────────────────────────────────────────

export interface TeamConfig {
  minSize: number;
  maxSize: number;
  allowSolo: boolean;
  useInviteCode: boolean;
  autoAddLeader: boolean;
}

// ── Round Config ────────────────────────────────────────

export interface RoundConfig {
  supportsElimination: boolean;
  supportsBrackets: boolean;
  supportsTimedRounds: boolean;
}

// ═══════════════════════════════════════════════════════
// MAIN: EventTypeConfig — the strategy interface
// ═══════════════════════════════════════════════════════

export interface EventTypeConfig {
  // ── Identity ──
  type: EventType;
  label: string;
  description: string;
  icon: string;               // Lucide icon name
  color: string;              // Tailwind gradient or color class

  // ── Capacity ──
  capacityModel: CapacityModel;
  defaultCapacity?: number;

  // ── Registration ──
  registration: {
    model: RegistrationModel;
    requiresApproval: boolean;
    allowTeams: boolean;
    teamConfig?: TeamConfig;
    extraFields: FieldDefinition[];
  };

  // ── Ticketing ──
  ticket: {
    template: TicketTemplate;
    fields: string[];
    hasQRCode: boolean;
    hasCheckIn: boolean;
    checkInModel?: CheckInModel;
  };

  // ── Pricing ──
  pricing: {
    model: PricingModel;
    defaultFree: boolean;
    supportsEarlyBird: boolean;
    supportsCoupons: boolean;
    supportsInstallments: boolean;
  };

  // ── Features ──
  features: EventFeatureFlags;

  // ── Rounds (for competition/drive) ──
  rounds?: RoundConfig;

  // ── UI Sections ──
  detailSections: string[];   // ordered sections on public event detail page
  adminTabs: string[];        // tabs on admin event management page

  // ── Post-Event ──
  postEvent: PostEventConfig;

  // ── Extra event fields ──
  // Additional fields the admin fills when creating this event type
  // (beyond the base event fields)
  extraEventFields: FieldDefinition[];
}

// ── Detail Section IDs ──────────────────────────────────
// Reusable section identifiers for building detail page layouts

export const DETAIL_SECTIONS = {
  OVERVIEW: "overview",
  SCHEDULE: "schedule",
  SPEAKERS: "speakers",
  TEAMS: "teams",
  ROUNDS: "rounds",
  PROBLEM_STATEMENTS: "problem-statements",
  PROBLEMS: "problems",
  SUBMISSIONS: "submissions",
  JUDGING: "judging",
  LEADERBOARD: "leaderboard",
  MATERIALS: "materials",
  PRIZES: "prizes",
  MENTORS: "mentors",
  REGISTRATION: "registration",
  EXHIBITORS: "exhibitors",
  SUB_EVENTS: "sub-events",
  POSITIONS: "positions",
  PROCESS: "process",
  VENUE: "venue",
  STREAMING: "streaming",
  QNA: "qna",
  FORUM: "forum",
  RESULTS: "results",
  GALLERY: "gallery",
  FEEDBACK: "feedback",
  RULES: "rules",
  VOTING: "voting",
  FAQ: "faq",
  SPONSORS: "sponsors",
  CONTACT: "contact",
} as const;

// ── Admin Tab IDs ───────────────────────────────────────

export const ADMIN_TABS = {
  OVERVIEW: "overview",
  REGISTRATIONS: "registrations",
  TEAMS: "teams",
  ROUNDS: "rounds",
  CHECK_IN: "check-in",
  SUBMISSIONS: "submissions",
  JUDGING: "judging",
  LEADERBOARD: "leaderboard",
  SCHEDULE: "schedule",
  SPEAKERS: "speakers",
  MATERIALS: "materials",
  CERTIFICATES: "certificates",
  PRIZES: "prizes",
  MENTORS: "mentors",
  EXHIBITORS: "exhibitors",
  SUB_EVENTS: "sub-events",
  APPLICATIONS: "applications",
  SHORTLIST: "shortlist",
  INTERVIEW_SLOTS: "interview-slots",
  PROBLEMS: "problems",
  FEST_PASSES: "fest-passes",
  SPONSORS: "sponsors",
  ATTENDANCE: "attendance",
  ANALYTICS: "analytics",
  FEEDBACK: "feedback",
  RESULTS: "results",
  SETTINGS: "settings",
  EXPORT: "export",
  GALLERY: "gallery",
  STREAMING: "streaming",
  VOTING: "voting",
  FORUM: "forum",
} as const;
