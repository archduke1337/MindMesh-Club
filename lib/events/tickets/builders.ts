// lib/events/tickets/builders.ts
// ═══════════════════════════════════════════════════════
// Ticket builders — one per template type
// Transform raw Appwrite docs into typed ticket data
// ═══════════════════════════════════════════════════════

import { EventType, TicketTemplate } from "../types";
import {
  TicketBuilder,
  TicketData,
  IndividualTicketData,
  TeamTicketData,
  PassTicketData,
  VirtualTicketData,
  SlotTicketData,
  EnrollmentTicketData,
  MinimalTicketData,
  RegistrationDocument,
  EventDocument,
} from "./types";

// ── Helpers ─────────────────────────────────────────────

function parseExtra(reg: RegistrationDocument): Record<string, unknown> {
  if (!reg.extraFields) return {};
  try {
    return JSON.parse(reg.extraFields);
  } catch {
    return {};
  }
}

function baseFields(
  reg: RegistrationDocument,
  event: EventDocument,
  template: TicketTemplate
) {
  return {
    ticketId: reg.$id,
    eventId: reg.eventId,
    eventType: (event.eventType || "workshop") as EventType,
    eventTitle: event.title,
    template,
    userName: reg.userName,
    userEmail: reg.userEmail,
    registeredAt: reg.registeredAt,
    status: reg.status,
    ticketQRData: reg.ticketQRData,
  };
}

// ── Individual Builder ──────────────────────────────────

export const individualBuilder: TicketBuilder = {
  template: "individual",
  build(reg, event): IndividualTicketData {
    return {
      ...baseFields(reg, event, "individual"),
      template: "individual",
      date: event.date,
      time: event.time,
      venue: event.venue,
      location: event.location,
      price: event.price,
    };
  },
};

// ── Team Builder ────────────────────────────────────────

export const teamBuilder: TicketBuilder = {
  template: "team",
  build(reg, event): TeamTicketData {
    const extra = parseExtra(reg);
    return {
      ...baseFields(reg, event, "team"),
      template: "team",
      date: event.date,
      time: event.time,
      venue: event.venue,
      location: event.location,
      teamName: (extra.teamName as string) || "Team",
      teamId: reg.teamId || "",
      inviteCode: (extra.inviteCode as string) || "",
      memberRole: (extra.memberRole as "leader" | "member") || "member",
      memberCount: (extra.memberCount as number) || 1,
      maxSize: (extra.maxSize as number) || 4,
      price: event.price,
    };
  },
};

// ── Pass Builder (Fest) ─────────────────────────────────

export const passBuilder: TicketBuilder = {
  template: "pass",
  build(reg, event): PassTicketData {
    const extra = parseExtra(reg);
    return {
      ...baseFields(reg, event, "pass"),
      template: "pass",
      festPassId: (extra.festPassId as string) || reg.$id,
      tier: (extra.tier as string) || "basic",
      college: extra.college as string | undefined,
      dates: event.date,
      venue: event.venue,
      perks: extra.perks as string[] | undefined,
    };
  },
};

// ── Virtual Builder (Webinar) ───────────────────────────

export const virtualBuilder: TicketBuilder = {
  template: "virtual",
  build(reg, event): VirtualTicketData {
    return {
      ...baseFields(reg, event, "virtual"),
      template: "virtual",
      date: event.date,
      time: event.time,
      platform: (event.platform as string) || "Online",
      meetingLink: (event.meetingLink as string) || undefined,
      timezone: "IST",
    };
  },
};

// ── Slot Builder (Drive, Exhibition) ────────────────────

export const slotBuilder: TicketBuilder = {
  template: "slot",
  build(reg, event): SlotTicketData {
    const extra = parseExtra(reg);
    return {
      ...baseFields(reg, event, "slot"),
      template: "slot",
      date: event.date,
      time: event.time,
      venue: event.venue,
      slotType: (extra.registrationType as string) || "general",
      slotNumber: extra.boothNumber as string | undefined,
      role: extra.applyingFor as string | undefined,
    };
  },
};

// ── Enrollment Builder (Bootcamp) ───────────────────────

export const enrollmentBuilder: TicketBuilder = {
  template: "enrollment",
  build(reg, event): EnrollmentTicketData {
    return {
      ...baseFields(reg, event, "enrollment"),
      template: "enrollment",
      startDate: event.date,
      endDate: (event.endDate as string) || event.date,
      venue: event.venue,
      cohort: (event.cohortName as string) || undefined,
      topic: (event.bootcampTopic as string) || event.title,
      schedule: (event.dailySchedule as string) || undefined,
    };
  },
};

// ── Minimal Builder (Social, Challenge) ─────────────────

export const minimalBuilder: TicketBuilder = {
  template: "minimal",
  build(reg, event): MinimalTicketData {
    return {
      ...baseFields(reg, event, "minimal"),
      template: "minimal",
      date: event.date,
      time: event.time || undefined,
      venue: event.venue || undefined,
    };
  },
};

// ── Builder Map ─────────────────────────────────────────

const BUILDER_MAP: Record<TicketTemplate, TicketBuilder> = {
  individual: individualBuilder,
  team: teamBuilder,
  pass: passBuilder,
  virtual: virtualBuilder,
  slot: slotBuilder,
  enrollment: enrollmentBuilder,
  minimal: minimalBuilder,
  none: minimalBuilder, // fallback
};

/**
 * Get the ticket builder for a template type.
 */
export function getTicketBuilder(template: TicketTemplate): TicketBuilder {
  return BUILDER_MAP[template] || minimalBuilder;
}

/**
 * Build a ticket from a registration + event using the correct template.
 */
export function buildTicket(
  registration: RegistrationDocument,
  event: EventDocument
): TicketData {
  const eventType = (event.eventType || "workshop") as EventType;

  // Import dynamically to avoid circular deps — use lazy config lookup
  const { getEventTypeConfig } = require("../registry");
  const config = getEventTypeConfig(eventType);
  const builder = getTicketBuilder(config.ticket.template);

  return builder.build(registration, event);
}
