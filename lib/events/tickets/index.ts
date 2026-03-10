// lib/events/tickets/index.ts
// Barrel export for the ticket system

export type {
  BaseTicketData,
  IndividualTicketData,
  TeamTicketData,
  PassTicketData,
  VirtualTicketData,
  SlotTicketData,
  EnrollmentTicketData,
  MinimalTicketData,
  TicketData,
  TicketBuilder,
  RegistrationDocument,
  EventDocument,
} from "./types";

export {
  buildTicket,
  getTicketBuilder,
  individualBuilder,
  teamBuilder,
  passBuilder,
  virtualBuilder,
  slotBuilder,
  enrollmentBuilder,
  minimalBuilder,
} from "./builders";
