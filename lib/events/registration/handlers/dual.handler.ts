// lib/events/registration/handlers/dual.handler.ts
// ═══════════════════════════════════════════════════════
// Dual registration handler (exhibitor + visitor)
// Used by: exhibition / expo
// Exhibitors need approval; visitors are auto-confirmed
// ═══════════════════════════════════════════════════════

import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { getEventTypeConfig } from "../../registry";
import {
  RegistrationHandler,
  DualRegistrationInput,
  RegistrationInput,
  RegistrationResult,
  EventContext,
} from "../types";
import { dualSchema } from "../schemas";
import { incrementRegisteredCount, decrementRegisteredCount } from "./individual.handler";

export const dualHandler: RegistrationHandler = {
  model: "dual",

  async validate(input: RegistrationInput, eventData: EventContext): Promise<void> {
    dualSchema.parse(input);
    const typedInput = input as DualRegistrationInput;

    if (typedInput.registrationType === "exhibitor") {
      // Check exhibitor slot capacity
      const exhibitorCount = await adminDb.listDocuments(
        DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [
          Query.equal("eventId", eventData.eventId),
          Query.contains("extraFields", '"registrationType":"exhibitor"'),
          Query.limit(1),
        ]
      );
      const maxExhibitors = (eventData.extraData.maxExhibitors as number) || eventData.capacity;
      if (maxExhibitors && exhibitorCount.total >= maxExhibitors) {
        throw new Error("No exhibitor slots available");
      }

      // Validate exhibitor application fields
      const config = getEventTypeConfig(eventData.eventType);
      const exhibitorFields = config.registration.extraFields.filter(
        (f) => f.required && f.showWhen?.value === "exhibitor"
      );
      for (const field of exhibitorFields) {
        if (!typedInput.applicationData?.[field.name]) {
          throw new Error(`${field.label} is required for exhibitors`);
        }
      }
    }
  },

  async execute(input: RegistrationInput, eventData: EventContext): Promise<RegistrationResult> {
    const typedInput = input as DualRegistrationInput;

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
        message: "Already registered for this event",
      };
    }

    const isExhibitor = typedInput.registrationType === "exhibitor";
    const ticketId = ID.unique();
    const ticketQRData = isExhibitor
      ? `TICKET|${ticketId}|${typedInput.userName}|${eventData.title}|EXHIBITOR`
      : null;

    const extraData = {
      registrationType: typedInput.registrationType,
      ...(typedInput.applicationData || {}),
    };

    await adminDb.createDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, ticketId, {
      eventId: eventData.eventId,
      userId: typedInput.userId,
      userName: typedInput.userName,
      userEmail: typedInput.userEmail,
      userPhone: typedInput.userPhone || null,
      registeredAt: new Date().toISOString(),
      status: isExhibitor ? "waitlisted" : "confirmed", // exhibitors need approval
      ticketQRData,
      teamId: null,
      checkInTime: null,
      source: "website",
      registrationModel: "dual",
      extraFields: JSON.stringify(extraData),
    });

    // Visitors are immediately counted; exhibitors only on approval
    if (!isExhibitor) {
      await incrementRegisteredCount(eventData.eventId);
    }

    return {
      success: true,
      registrationId: ticketId,
      ticketId,
      status: isExhibitor ? "pending_approval" : "confirmed",
      message: isExhibitor
        ? "Exhibitor application submitted. You will be notified once approved."
        : "Visitor registration confirmed!",
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
