// lib/events/registration/orchestrator.ts
// ═══════════════════════════════════════════════════════
// Registration Orchestrator
// Routes registration requests to the correct handler
// based on the event type's registration model
// ═══════════════════════════════════════════════════════

import { RegistrationModel } from "../types";
import { getEventTypeConfig } from "../registry";
import {
  RegistrationHandler,
  RegistrationInput,
  RegistrationResult,
  EventContext,
} from "./types";
import { individualHandler } from "./handlers/individual.handler";
import { teamHandler } from "./handlers/team.handler";
import { applicationHandler } from "./handlers/application.handler";
import { rsvpHandler } from "./handlers/rsvp.handler";
import { dualHandler } from "./handlers/dual.handler";
import { festPassHandler } from "./handlers/fest-pass.handler";
import { rollingHandler } from "./handlers/rolling.handler";

// ── Handler Map ─────────────────────────────────────────

const HANDLER_MAP: Record<RegistrationModel, RegistrationHandler> = {
  individual: individualHandler,
  team: teamHandler,
  application: applicationHandler,
  rsvp: rsvpHandler,
  dual: dualHandler,
  "fest-pass": festPassHandler,
  rolling: rollingHandler,
};

/**
 * Get the appropriate registration handler for an event type.
 */
export function getRegistrationHandler(eventType: string): RegistrationHandler {
  const config = getEventTypeConfig(eventType as import("../types").EventType);
  const handler = HANDLER_MAP[config.registration.model];

  if (!handler) {
    throw new Error(`No registration handler for model: ${config.registration.model}`);
  }

  return handler;
}

/**
 * Execute a complete registration flow:
 * 1. Resolve handler from event type
 * 2. Validate input
 * 3. Execute registration
 *
 * Returns a RegistrationResult with status and ticket info.
 */
export async function registerForEvent(
  input: RegistrationInput,
  eventData: EventContext
): Promise<RegistrationResult> {
  const handler = getRegistrationHandler(eventData.eventType);

  // Validate
  await handler.validate(input, eventData);

  // Execute
  return handler.execute(input, eventData);
}

/**
 * Cancel a registration.
 * Resolves the correct handler to ensure proper cleanup
 * (e.g., team handlers also remove team members).
 */
export async function cancelRegistration(
  registrationId: string,
  eventData: EventContext
): Promise<boolean> {
  const handler = getRegistrationHandler(eventData.eventType);
  return handler.cancel(registrationId, eventData);
}

/**
 * Get the registration model name for an event type.
 */
export function getRegistrationModel(eventType: string): RegistrationModel {
  const config = getEventTypeConfig(eventType as import("../types").EventType);
  return config.registration.model;
}

/**
 * Check if an event type supports team join (invite code).
 */
export function supportsTeamJoin(eventType: string): boolean {
  const config = getEventTypeConfig(eventType as import("../types").EventType);
  return config.registration.model === "team" && config.registration.allowTeams;
}
