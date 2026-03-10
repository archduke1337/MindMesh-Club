// lib/events/registry.ts
// ═══════════════════════════════════════════════════════
// Central Event Type Registry
// Maps event type → config, provides query helpers
// ═══════════════════════════════════════════════════════

import { EventType, EventTypeConfig, EventFeatureFlags } from "./types";
import { hackathonConfig } from "./types/hackathon.config";
import { competitionConfig } from "./types/competition.config";
import { workshopConfig } from "./types/workshop.config";
import { talkConfig } from "./types/talk.config";
import { bootcampConfig } from "./types/bootcamp.config";
import { exhibitionConfig } from "./types/exhibition.config";
import { socialConfig } from "./types/social.config";
import { festConfig } from "./types/fest.config";
import { webinarConfig } from "./types/webinar.config";
import { driveConfig } from "./types/drive.config";
import { challengeConfig } from "./types/challenge.config";

// ── Registry Map ────────────────────────────────────────

const EVENT_TYPE_REGISTRY: Record<EventType, EventTypeConfig> = {
  hackathon: hackathonConfig,
  competition: competitionConfig,
  workshop: workshopConfig,
  talk: talkConfig,
  bootcamp: bootcampConfig,
  exhibition: exhibitionConfig,
  social: socialConfig,
  fest: festConfig,
  webinar: webinarConfig,
  drive: driveConfig,
  challenge: challengeConfig,
};

// ── Core Accessors ──────────────────────────────────────

/**
 * Get the full config for an event type.
 * Throws if the type is invalid.
 */
export function getEventTypeConfig(type: EventType): EventTypeConfig {
  const config = EVENT_TYPE_REGISTRY[type];
  if (!config) {
    throw new Error(`Unknown event type: ${type}`);
  }
  return config;
}

/**
 * Get all registered event type configs.
 */
export function getAllEventTypeConfigs(): EventTypeConfig[] {
  return Object.values(EVENT_TYPE_REGISTRY);
}

/**
 * Get all registered event types.
 */
export function getAllEventTypes(): EventType[] {
  return Object.keys(EVENT_TYPE_REGISTRY) as EventType[];
}

/**
 * Check if a string is a valid event type.
 */
export function isValidEventType(type: string): type is EventType {
  return type in EVENT_TYPE_REGISTRY;
}

// ── Feature Queries ─────────────────────────────────────

/**
 * Get all event types that have a specific feature enabled.
 */
export function getEventTypesByFeature(
  feature: keyof EventFeatureFlags
): EventType[] {
  return Object.entries(EVENT_TYPE_REGISTRY)
    .filter(([, config]) => config.features[feature])
    .map(([type]) => type as EventType);
}

/**
 * Check if a specific event type has a feature enabled.
 */
export function eventTypeHasFeature(
  type: EventType,
  feature: keyof EventFeatureFlags
): boolean {
  return getEventTypeConfig(type).features[feature];
}

/**
 * Get enabled features for an event type as an array of feature names.
 */
export function getEnabledFeatures(type: EventType): (keyof EventFeatureFlags)[] {
  const config = getEventTypeConfig(type);
  return (Object.entries(config.features) as [keyof EventFeatureFlags, boolean][])
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature);
}

// ── Registration Queries ────────────────────────────────

/**
 * Get all event types that use a specific registration model.
 */
export function getEventTypesByRegistrationModel(
  model: EventTypeConfig["registration"]["model"]
): EventType[] {
  return Object.entries(EVENT_TYPE_REGISTRY)
    .filter(([, config]) => config.registration.model === model)
    .map(([type]) => type as EventType);
}

/**
 * Get all event types that require approval.
 */
export function getApprovalRequiredTypes(): EventType[] {
  return Object.entries(EVENT_TYPE_REGISTRY)
    .filter(([, config]) => config.registration.requiresApproval)
    .map(([type]) => type as EventType);
}

/**
 * Get all event types that support teams.
 */
export function getTeamEnabledTypes(): EventType[] {
  return Object.entries(EVENT_TYPE_REGISTRY)
    .filter(([, config]) => config.registration.allowTeams)
    .map(([type]) => type as EventType);
}

// ── Ticket Queries ──────────────────────────────────────

/**
 * Get all event types that use a specific ticket template.
 */
export function getEventTypesByTicketTemplate(
  template: EventTypeConfig["ticket"]["template"]
): EventType[] {
  return Object.entries(EVENT_TYPE_REGISTRY)
    .filter(([, config]) => config.ticket.template === template)
    .map(([type]) => type as EventType);
}

// ── UI Helpers ──────────────────────────────────────────

/**
 * Get event type options for a select dropdown.
 * Returns { value, label, description, icon, color } for each type.
 */
export function getEventTypeOptions() {
  return getAllEventTypeConfigs().map((config) => ({
    value: config.type,
    label: config.label,
    description: config.description,
    icon: config.icon,
    color: config.color,
  }));
}

/**
 * Get the detail page sections for a specific event type (ordered).
 */
export function getDetailSections(type: EventType): string[] {
  return getEventTypeConfig(type).detailSections;
}

/**
 * Get the admin tabs for a specific event type (ordered).
 */
export function getAdminTabs(type: EventType): string[] {
  return getEventTypeConfig(type).adminTabs;
}

/**
 * Get extra registration fields for a specific event type.
 */
export function getRegistrationFields(type: EventType) {
  return getEventTypeConfig(type).registration.extraFields;
}

/**
 * Get extra event creation fields for a specific event type.
 */
export function getExtraEventFields(type: EventType) {
  return getEventTypeConfig(type).extraEventFields;
}
