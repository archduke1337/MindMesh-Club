// lib/events/registration/handlers/individual.handler.ts
// ═══════════════════════════════════════════════════════
// Individual registration handler
// Used by: workshop, webinar, competition (solo mode)
// ═══════════════════════════════════════════════════════

import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { getEventTypeConfig } from "../../registry";
import {
  RegistrationHandler,
  IndividualRegistrationInput,
  RegistrationInput,
  RegistrationResult,
  EventContext,
} from "../types";
import { individualSchema } from "../schemas";

export const individualHandler: RegistrationHandler = {
  model: "individual",

  async validate(input: RegistrationInput, eventData: EventContext): Promise<void> {
    individualSchema.parse(input);

    // Check capacity
    if (eventData.capacity && eventData.registered >= eventData.capacity) {
      throw new Error("Event is full");
    }

    // Validate extra fields against config
    const config = getEventTypeConfig(eventData.eventType);
    const typedInput = input as IndividualRegistrationInput;
    const requiredFields = config.registration.extraFields.filter((f) => f.required);

    for (const field of requiredFields) {
      if (field.showWhen) continue; // conditional fields validated separately
      if (!typedInput.extraFields?.[field.name]) {
        throw new Error(`${field.label} is required`);
      }
    }
  },

  async execute(input: RegistrationInput, eventData: EventContext): Promise<RegistrationResult> {
    const typedInput = input as IndividualRegistrationInput;

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
        message: "Already registered for this event",
      };
    }

    // Create registration
    const ticketId = ID.unique();
    const ticketQRData = `TICKET|${ticketId}|${typedInput.userName}|${eventData.title}`;

    await adminDb.createDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, ticketId, {
      eventId: eventData.eventId,
      userId: typedInput.userId,
      userName: typedInput.userName,
      userEmail: typedInput.userEmail,
      userPhone: typedInput.userPhone || null,
      registeredAt: new Date().toISOString(),
      status: "confirmed",
      ticketQRData,
      teamId: null,
      checkInTime: null,
      source: "website",
      registrationModel: "individual",
      extraFields: typedInput.extraFields ? JSON.stringify(typedInput.extraFields) : null,
    });

    // Increment registered count with retry
    await incrementRegisteredCount(eventData.eventId);

    return {
      success: true,
      registrationId: ticketId,
      ticketId,
      status: "confirmed",
      message: "Registration successful",
    };
  },

  async cancel(registrationId: string, eventData: EventContext): Promise<boolean> {
    await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, registrationId);
    await decrementRegisteredCount(eventData.eventId);
    return true;
  },
};

// ── Shared count helpers ────────────────────────────────

async function incrementRegisteredCount(eventId: string) {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const freshEvent = await adminDb.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);
      const currentCount = (freshEvent.registered as number) || 0;
      await adminDb.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId, {
        registered: currentCount + 1,
      });
      return;
    } catch {
      if (attempt === MAX_RETRIES - 1) throw new Error("Failed to update registration count");
      await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
    }
  }
}

async function decrementRegisteredCount(eventId: string) {
  try {
    const freshEvent = await adminDb.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);
    const currentCount = (freshEvent.registered as number) || 0;
    if (currentCount > 0) {
      await adminDb.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId, {
        registered: currentCount - 1,
      });
    }
  } catch {
    console.warn(`Failed to decrement registration count for event ${eventId}`);
  }
}

export { incrementRegisteredCount, decrementRegisteredCount };
