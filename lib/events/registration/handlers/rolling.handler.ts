// lib/events/registration/handlers/rolling.handler.ts
// ═══════════════════════════════════════════════════════
// Rolling registration handler
// Used by: challenge (30-day coding, weekly problems)
// Allows joining anytime, even after the event started
// ═══════════════════════════════════════════════════════

import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import {
  RegistrationHandler,
  RollingRegistrationInput,
  RegistrationInput,
  RegistrationResult,
  EventContext,
} from "../types";
import { rollingSchema } from "../schemas";
import { incrementRegisteredCount, decrementRegisteredCount } from "./individual.handler";

export const rollingHandler: RegistrationHandler = {
  model: "rolling",

  async validate(input: RegistrationInput, eventData: EventContext): Promise<void> {
    rollingSchema.parse(input);

    // Rolling events allow late join unless explicitly blocked
    const allowLateJoin = eventData.extraData.allowLateJoin !== false;
    if (!allowLateJoin && eventData.status === "ongoing") {
      throw new Error("This challenge no longer accepts new participants");
    }

    // Check if the challenge has ended
    if (eventData.status === "completed" || eventData.status === "cancelled") {
      throw new Error("This challenge has ended");
    }
  },

  async execute(input: RegistrationInput, eventData: EventContext): Promise<RegistrationResult> {
    const typedInput = input as RollingRegistrationInput;

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
        message: "Already participating in this challenge",
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
      ticketQRData: null,
      teamId: null,
      checkInTime: null,
      source: "website",
      registrationModel: "rolling",
      extraFields: typedInput.extraFields ? JSON.stringify(typedInput.extraFields) : null,
    });

    await incrementRegisteredCount(eventData.eventId);

    return {
      success: true,
      registrationId: ticketId,
      ticketId,
      status: "confirmed",
      message: "You're in! Welcome to the challenge.",
    };
  },

  async cancel(registrationId: string, eventData: EventContext): Promise<boolean> {
    await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, registrationId);
    await decrementRegisteredCount(eventData.eventId);
    return true;
  },
};
