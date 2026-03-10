// lib/events/tickets/types.ts
// ═══════════════════════════════════════════════════════
// Ticket system types for the type-driven architecture
// ═══════════════════════════════════════════════════════

import { TicketTemplate, EventType } from "../types";

/**
 * Base ticket data — common across all templates
 */
export interface BaseTicketData {
  ticketId: string;
  eventId: string;
  eventType: EventType;
  eventTitle: string;
  template: TicketTemplate;
  userName: string;
  userEmail: string;
  registeredAt: string;
  status: string;
  ticketQRData: string | null;
}

/**
 * Individual ticket — workshop, competition (solo)
 */
export interface IndividualTicketData extends BaseTicketData {
  template: "individual";
  date: string;
  time: string;
  venue: string;
  location: string;
  seatNumber?: string;
  price?: number;
}

/**
 * Team ticket — hackathon, competition (team mode)
 */
export interface TeamTicketData extends BaseTicketData {
  template: "team";
  date: string;
  time: string;
  venue: string;
  location: string;
  teamName: string;
  teamId: string;
  inviteCode: string;
  memberRole: "leader" | "member";
  memberCount: number;
  maxSize: number;
  price?: number;
}

/**
 * Fest pass ticket — multi-day fest
 */
export interface PassTicketData extends BaseTicketData {
  template: "pass";
  festPassId: string;
  tier: string;
  college?: string;
  dates: string;   // "Dec 15-17, 2025"
  venue: string;
  perks?: string[];
}

/**
 * Virtual ticket — webinar, online events
 */
export interface VirtualTicketData extends BaseTicketData {
  template: "virtual";
  date: string;
  time: string;
  platform: string;
  meetingLink?: string;  // only shared close to event time
  timezone?: string;
}

/**
 * Slot ticket — drive (interview), exhibition (booth)
 */
export interface SlotTicketData extends BaseTicketData {
  template: "slot";
  date: string;
  time: string;
  venue: string;
  slotType: string;   // "interview", "booth", "exhibition"
  slotNumber?: string;
  role?: string;       // applied position
}

/**
 * Enrollment ticket — bootcamp
 */
export interface EnrollmentTicketData extends BaseTicketData {
  template: "enrollment";
  startDate: string;
  endDate: string;
  venue: string;
  cohort?: string;
  topic: string;
  schedule?: string;
}

/**
 * Minimal ticket — social, challenge (no QR, basic info)
 */
export interface MinimalTicketData extends BaseTicketData {
  template: "minimal";
  date: string;
  time?: string;
  venue?: string;
  note?: string;
}

/**
 * Union type of all ticket data
 */
export type TicketData =
  | IndividualTicketData
  | TeamTicketData
  | PassTicketData
  | VirtualTicketData
  | SlotTicketData
  | EnrollmentTicketData
  | MinimalTicketData;

/**
 * Ticket builder interface — each template implements this
 */
export interface TicketBuilder {
  template: TicketTemplate;

  /**
   * Build ticket data from a registration document + event data.
   */
  build(
    registration: RegistrationDocument,
    event: EventDocument
  ): TicketData;
}

/**
 * Minimal type for registration documents from Appwrite
 */
export interface RegistrationDocument {
  $id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  registeredAt: string;
  status: string;
  ticketQRData: string | null;
  teamId: string | null;
  registrationModel?: string;
  extraFields?: string | null;
  [key: string]: unknown;
}

/**
 * Minimal type for event documents from Appwrite
 */
export interface EventDocument {
  $id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  eventType?: string;
  price?: number;
  discountPrice?: number | null;
  [key: string]: unknown;
}
