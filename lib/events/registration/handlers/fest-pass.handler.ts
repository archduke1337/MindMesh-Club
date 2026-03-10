// lib/events/registration/handlers/fest-pass.handler.ts
// ═══════════════════════════════════════════════════════
// Fest pass registration handler
// Used by: fest (tech fest / multi-day fest)
// Creates a fest pass that gives access to sub-events
// ═══════════════════════════════════════════════════════

import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import {
  RegistrationHandler,
  FestPassRegistrationInput,
  RegistrationInput,
  RegistrationResult,
  EventContext,
} from "../types";
import { festPassSchema } from "../schemas";
import { incrementRegisteredCount, decrementRegisteredCount } from "./individual.handler";

function generateFestPassId(): string {
  const prefix = "FEST";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 6; i++) {
    suffix += chars[bytes[i] % chars.length];
  }
  return `${prefix}-${suffix}`;
}

export const festPassHandler: RegistrationHandler = {
  model: "fest-pass",

  async validate(input: RegistrationInput, eventData: EventContext): Promise<void> {
    festPassSchema.parse(input);
    // Fest events typically have high or unlimited capacity
    // but we still check for a hard cap
    if (eventData.capacity && eventData.registered >= eventData.capacity) {
      throw new Error("Fest registrations are full");
    }
  },

  async execute(input: RegistrationInput, eventData: EventContext): Promise<RegistrationResult> {
    const typedInput = input as FestPassRegistrationInput;

    // Check duplicate
    const existing = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
      Query.equal("eventId", eventData.eventId),
      Query.equal("userId", typedInput.userId),
      Query.limit(1),
    ]);

    if (existing.documents.length > 0) {
      const reg = existing.documents[0];
      return {
        success: true,
        registrationId: reg.$id,
        ticketId: reg.$id,
        status: "confirmed",
        message: "You already have a fest pass",
      };
    }

    const ticketId = ID.unique();
    const festPassId = generateFestPassId();
    const ticketQRData = `FESTPASS|${festPassId}|${typedInput.userName}|${eventData.title}`;

    const extraData = {
      festPassId,
      tier: typedInput.tier || "basic",
      college: typedInput.college || null,
      yearOfStudy: typedInput.yearOfStudy || null,
      branch: typedInput.branch || null,
      ...(typedInput.extraFields || {}),
    };

    const isPaid = typedInput.tier && typedInput.tier !== "basic" && typedInput.tier !== "free";

    await adminDb.createDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, ticketId, {
      eventId: eventData.eventId,
      userId: typedInput.userId,
      userName: typedInput.userName,
      userEmail: typedInput.userEmail,
      userPhone: typedInput.userPhone || null,
      registeredAt: new Date().toISOString(),
      status: isPaid ? "waitlisted" : "confirmed", // "waitlisted" = pending payment
      ticketQRData,
      teamId: null,
      checkInTime: null,
      source: "website",
      registrationModel: "fest-pass",
      extraFields: JSON.stringify(extraData),
    });

    if (!isPaid) {
      await incrementRegisteredCount(eventData.eventId);
    }

    return {
      success: true,
      registrationId: ticketId,
      ticketId,
      status: isPaid ? "pending_payment" : "confirmed",
      message: isPaid
        ? `Fest pass reserved. Complete payment to confirm (Pass ID: ${festPassId}).`
        : `Fest pass confirmed! Your pass ID: ${festPassId}`,
    };
  },

  async cancel(registrationId: string, eventData: EventContext): Promise<boolean> {
    const reg = await adminDb.getDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, registrationId);
    const wasConfirmed = (reg.status as string) === "confirmed";

    await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, registrationId);

    if (wasConfirmed) {
      await decrementRegisteredCount(eventData.eventId);
    }
    return true;
  },
};
