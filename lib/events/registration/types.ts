// lib/events/registration/types.ts
// ═══════════════════════════════════════════════════════
// Registration system types
// ═══════════════════════════════════════════════════════

import { EventType, RegistrationModel } from "../types";

/**
 * Base registration input — common across all models.
 * Identity fields (userId, userName, userEmail) come from
 * the authenticated session, NOT from the request body.
 */
export interface BaseRegistrationInput {
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
}

/**
 * Individual registration (workshop, webinar, competition solo)
 */
export interface IndividualRegistrationInput extends BaseRegistrationInput {
  extraFields?: Record<string, unknown>;
}

/**
 * Team registration (hackathon, team competitions)
 */
export interface TeamRegistrationInput extends BaseRegistrationInput {
  teamName: string;
  teamDescription?: string;
  maxSize?: number;
}

/**
 * Join existing team via invite code
 */
export interface TeamJoinInput extends BaseRegistrationInput {
  inviteCode: string;
}

/**
 * Application-based registration (bootcamp, drive)
 */
export interface ApplicationRegistrationInput extends BaseRegistrationInput {
  applicationData: Record<string, unknown>;  // dynamic fields from config
}

/**
 * RSVP registration (talk, social)
 */
export interface RSVPRegistrationInput extends BaseRegistrationInput {
  extraFields?: Record<string, unknown>;
}

/**
 * Dual registration (exhibition — exhibitor or visitor)
 */
export interface DualRegistrationInput extends BaseRegistrationInput {
  registrationType: "exhibitor" | "visitor";
  applicationData?: Record<string, unknown>;  // exhibitor details
}

/**
 * Fest pass registration
 */
export interface FestPassRegistrationInput extends BaseRegistrationInput {
  tier?: string;             // pass tier
  college?: string;
  yearOfStudy?: string;
  branch?: string;
  extraFields?: Record<string, unknown>;
}

/**
 * Rolling registration (challenge — join anytime)
 */
export interface RollingRegistrationInput extends BaseRegistrationInput {
  extraFields?: Record<string, unknown>;
}

/**
 * Union type of all registration inputs
 */
export type RegistrationInput =
  | IndividualRegistrationInput
  | TeamRegistrationInput
  | TeamJoinInput
  | ApplicationRegistrationInput
  | RSVPRegistrationInput
  | DualRegistrationInput
  | FestPassRegistrationInput
  | RollingRegistrationInput;

/**
 * Registration result returned by handlers
 */
export interface RegistrationResult {
  success: boolean;
  registrationId: string;
  ticketId: string;
  status: "confirmed" | "waitlisted" | "pending_approval" | "pending_payment";
  teamId?: string;
  inviteCode?: string;
  message: string;
}

/**
 * Registration handler interface — each registration model implements this.
 */
export interface RegistrationHandler {
  model: RegistrationModel;

  /**
   * Validate the input specific to this registration model.
   * Returns validated & normalized data or throws.
   */
  validate(input: RegistrationInput, eventData: EventContext): Promise<void>;

  /**
   * Execute the registration.
   * Creates documents, updates counts, sends emails.
   */
  execute(input: RegistrationInput, eventData: EventContext): Promise<RegistrationResult>;

  /**
   * Cancel/unregister. Returns true if successful.
   */
  cancel(registrationId: string, eventData: EventContext): Promise<boolean>;
}

/**
 * Contextual event data passed to handlers.
 * This avoids each handler fetching the event separately.
 */
export interface EventContext {
  eventId: string;
  eventType: EventType;
  title: string;
  capacity: number;
  registered: number;
  startDate: string;
  endDate: string;
  venue: string;
  isOnline: boolean;
  status: string;
  extraData: Record<string, unknown>;  // type-specific event fields
}
