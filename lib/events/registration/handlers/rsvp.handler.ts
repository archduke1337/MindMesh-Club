// lib/events/registration/handlers/rsvp.handler.ts
// ═══════════════════════════════════════════════════════
// RSVP registration handler
// Used by: talk, social
// Simplest model — instant confirmation, no approval
// ═══════════════════════════════════════════════════════

import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import {
  RegistrationHandler,
  RSVPRegistrationInput,
  RegistrationInput,
  RegistrationResult,
  EventContext,
} from "../types";
import { rsvpSchema } from "../schemas";
import { incrementRegisteredCount, decrementRegisteredCount } from "./individual.handler";

export const rsvpHandler: RegistrationHandler = {
  model: "rsvp",

  async validate(input: RegistrationInput, eventData: EventContext): Promise<void> {
    rsvpSchema.parse(input);
    // RSVP events usually have flexible capacity, but still check
    if (eventData.capacity && eventData.registered >= eventData.capacity) {
      throw new Error("Event has reached capacity");
    }
  },

  async execute(input: RegistrationInput, eventData: EventContext): Promise<RegistrationResult> {
    const typedInput = input as RSVPRegistrationInput;

    // Check duplicate
    const existing = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
      Query.equal("eventId", eventData.eventId),
      Query.equal("userId", typedInput.userId),
      Query.limit(1),
    ]);

    if (existing.documents.length > 0) {
      return {
        success: true,
        registrationId: existing.documents[0].$id,
        ticketId: existing.documents[0].$id,
        status: "confirmed",
        message: "Already RSVP'd for this event",
      };
    }

    const ticketId = ID.unique();

    await adminDb.createDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, ticketId, {
      eventId: eventData.eventId,
      userId: typedInput.userId,
      userName: typedInput.userName,
      userEmail: typedInput.userEmail,
      userPhone: typedInput.userPhone || null,
      registeredAt: new Date().toISOString(),
      status: "confirmed",
      ticketQRData: null, // RSVP events typically don't need QR tickets
      teamId: null,
      checkInTime: null,
      source: "website",
      registrationModel: "rsvp",
      extraFields: typedInput.extraFields ? JSON.stringify(typedInput.extraFields) : null,
    });

    await incrementRegisteredCount(eventData.eventId);

    return {
      success: true,
      registrationId: ticketId,
      ticketId,
      status: "confirmed",
      message: "RSVP confirmed!",
    };
  },

  async cancel(registrationId: string, eventData: EventContext): Promise<boolean> {
    await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, registrationId);
    await decrementRegisteredCount(eventData.eventId);
    return true;
  },
};
