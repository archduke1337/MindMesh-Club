// lib/events/registration/handlers/application.handler.ts
// ═══════════════════════════════════════════════════════
// Application-based registration handler
// Used by: bootcamp, drive
// Requires admin approval before confirmation
// ═══════════════════════════════════════════════════════

import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { getEventTypeConfig } from "../../registry";
import {
  RegistrationHandler,
  ApplicationRegistrationInput,
  RegistrationInput,
  RegistrationResult,
  EventContext,
} from "../types";
import { applicationSchema } from "../schemas";

export const applicationHandler: RegistrationHandler = {
  model: "application",

  async validate(input: RegistrationInput, eventData: EventContext): Promise<void> {
    applicationSchema.parse(input);

    const typedInput = input as ApplicationRegistrationInput;
    const config = getEventTypeConfig(eventData.eventType);
    const requiredFields = config.registration.extraFields.filter((f) => f.required);

    for (const field of requiredFields) {
      if (field.showWhen) continue;
      const value = typedInput.applicationData[field.name];
      if (value === undefined || value === null || value === "") {
        throw new Error(`${field.label} is required`);
      }
    }

    // Capacity check (soft — applications can exceed, but approvals are capped)
    // We still check to avoid absurd numbers
    if (eventData.capacity && eventData.registered >= eventData.capacity * 3) {
      throw new Error("Applications are closed for this event");
    }
  },

  async execute(input: RegistrationInput, eventData: EventContext): Promise<RegistrationResult> {
    const typedInput = input as ApplicationRegistrationInput;

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
        status: (reg.status as string) === "confirmed" ? "confirmed" : "pending_approval",
        message: "You have already applied for this event",
      };
    }

    // Create registration with pending_approval status
    const ticketId = ID.unique();
    const ticketQRData = `TICKET|${ticketId}|${typedInput.userName}|${eventData.title}`;

    await adminDb.createDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, ticketId, {
      eventId: eventData.eventId,
      userId: typedInput.userId,
      userName: typedInput.userName,
      userEmail: typedInput.userEmail,
      userPhone: typedInput.userPhone || null,
      registeredAt: new Date().toISOString(),
      status: "waitlisted", // pending approval — using existing status enum
      ticketQRData,
      teamId: null,
      checkInTime: null,
      source: "website",
      registrationModel: "application",
      extraFields: JSON.stringify(typedInput.applicationData),
    });

    // Don't increment registered count yet — only on approval

    return {
      success: true,
      registrationId: ticketId,
      ticketId,
      status: "pending_approval",
      message: "Application submitted successfully. You will be notified once reviewed.",
    };
  },

  async cancel(registrationId: string, eventData: EventContext): Promise<boolean> {
    const reg = await adminDb.getDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, registrationId);
    const wasConfirmed = (reg.status as string) === "confirmed";

    await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, registrationId);

    // Only decrement if the registration was confirmed
    if (wasConfirmed) {
      try {
        const freshEvent = await adminDb.getDocument(
          DATABASE_ID,
          COLLECTIONS.EVENTS,
          eventData.eventId
        );
        const currentCount = (freshEvent.registered as number) || 0;
        if (currentCount > 0) {
          await adminDb.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventData.eventId, {
            registered: currentCount - 1,
          });
        }
      } catch {
        console.warn(`Failed to decrement count for event ${eventData.eventId}`);
      }
    }
    return true;
  },
};

/**
 * Approve an application — called by admin.
 * Changes status from waitlisted to confirmed, increments count.
 */
export async function approveApplication(registrationId: string, eventId: string): Promise<void> {
  await adminDb.updateDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, registrationId, {
    status: "confirmed",
  });

  // Increment registered count
  const freshEvent = await adminDb.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);
  const currentCount = (freshEvent.registered as number) || 0;
  await adminDb.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId, {
    registered: currentCount + 1,
  });
}

/**
 * Reject an application — called by admin.
 */
export async function rejectApplication(registrationId: string): Promise<void> {
  await adminDb.updateDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, registrationId, {
    status: "cancelled",
  });
}
