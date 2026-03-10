// lib/events/post-event/types.ts
// ═══════════════════════════════════════════════════════
// Types for post-event operations per event type
// ═══════════════════════════════════════════════════════

import { EventType } from "../types";

// ── Results ─────────────────────────────────────────

export interface ResultsConfig {
  /** How results are ranked */
  rankingMode: "score" | "position" | "category" | "tier" | "none";
  /** Whether results come from submissions/judging scores */
  sourceFromJudging: boolean;
  /** Whether category winners are relevant */
  hasCategoryWinners: boolean;
  /** Custom result label (e.g., "Placements" for drive) */
  resultLabel: string;
  /** Supports team-level results */
  teamResults: boolean;
}

export interface ResultEntry {
  rank: number;
  participantId: string;
  participantName: string;
  teamId?: string;
  teamName?: string;
  score?: number;
  category?: string;
  prize?: string;
  notes?: string;
}

export interface EventResults {
  eventId: string;
  eventType: EventType;
  isPublished: boolean;
  publishedAt?: string;
  rankings: ResultEntry[];
  categoryWinners?: Record<string, ResultEntry[]>;
  summary?: string;
}

// ── Certificates ────────────────────────────────────

export type CertificateType =
  | "participation"
  | "winner"
  | "runner-up"
  | "completion"
  | "speaker"
  | "mentor"
  | "volunteer"
  | "organizer"
  | "exhibitor";

export interface CertificateConfig {
  /** Which certificate types this event supports */
  availableTypes: CertificateType[];
  /** Whether attendance/completion is needed for participation cert */
  requiresCompletion: boolean;
  /** Min attendance % required (for bootcamp/workshop) */
  minAttendancePercent?: number;
  /** Custom certificate title */
  titleTemplate: string;
}

export interface CertificateData {
  recipientName: string;
  recipientEmail: string;
  eventTitle: string;
  eventType: EventType;
  certType: CertificateType;
  issuedAt: string;
  eventDate: string;
  /** For winners */
  rank?: number;
  prize?: string;
  /** For bootcamp */
  topic?: string;
  completionPercent?: number;
  /** Unique cert ID for verification */
  certificateId: string;
}

// ── Feedback ────────────────────────────────────────

export interface FeedbackConfig {
  /** Question set to use */
  questionSet: "default" | "quick" | "advanced";
  /** Whether anonymous feedback is allowed */
  allowAnonymous: boolean;
  /** Auto-send feedback request email after event */
  autoSendEmail: boolean;
  /** Delay (hours) after event end to send email */
  emailDelayHours: number;
  /** Event-type-specific additional questions */
  extraQuestions?: FeedbackExtraQuestion[];
}

export interface FeedbackExtraQuestion {
  id: string;
  question: string;
  type: "rating" | "text" | "select";
  options?: string[];
  required: boolean;
}

// ── Gallery ─────────────────────────────────────────

export interface GalleryConfig {
  /** Allow participant uploads */
  allowParticipantUploads: boolean;
  /** Require approval before showing */
  requireApproval: boolean;
  /** Auto-categorize based on event type */
  autoCategory: string;
  /** Max uploads per participant */
  maxUploadsPerUser: number;
}

// ── Resource Sharing ────────────────────────────────

export interface ResourceSharingConfig {
  /** Types of resources expected */
  resourceTypes: ResourceType[];
  /** Who can upload */
  uploadPermission: "admin" | "speakers" | "participants";
  /** Auto-share after event ends */
  autoShare: boolean;
}

export type ResourceType =
  | "slides"
  | "recording"
  | "code"
  | "notes"
  | "assignment"
  | "solution"
  | "reference"
  | "tool";

// ── Combined Post-Event Module ──────────────────────

export interface PostEventModule {
  eventType: EventType;
  results: ResultsConfig;
  certificates: CertificateConfig;
  feedback: FeedbackConfig;
  gallery: GalleryConfig;
  resourceSharing: ResourceSharingConfig;
}
