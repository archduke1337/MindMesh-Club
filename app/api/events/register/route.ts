// app/api/events/register/route.ts
// Server-side endpoint for type-driven event registration.
// Delegates to the registration orchestrator based on event type.
import { NextRequest } from 'next/server';
import { sendRegistrationEmail } from '@/lib/emailService';
import { verifyAuth } from '@/lib/apiAuth';
import { handleApiError, ApiError, successResponse } from '@/lib/apiErrorHandler';
import { adminDb, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/server';
import { registerForEvent, cancelRegistration } from '@/lib/events/registration/orchestrator';
import { isValidEventType } from '@/lib/events/registry';
import { z } from 'zod';

// Legacy type mapping for backward compatibility
const LEGACY_TYPE_MAP: Record<string, string> = {
  seminar: "talk",
  conference: "talk",
  meetup: "social",
};

function resolveEventType(raw: string): string {
  return LEGACY_TYPE_MAP[raw] || raw;
}

const registerBodySchema = z.object({
  eventId: z.string().min(1),
  // Optional: allow client to specify mode for team/dual
  mode: z.enum(["create", "join", "exhibitor", "visitor"]).optional(),
  teamName: z.string().optional(),
  inviteCode: z.string().optional(),
  tier: z.string().optional(),
  extraFields: z.record(z.unknown()).optional(),
});

/**
 * POST /api/events/register
 *
 * Type-driven registration. Resolves the event type,
 * then delegates to the correct registration handler.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication via session cookie
    const { authenticated, user: authUser } = await verifyAuth(request);
    if (!authenticated || !authUser) {
      throw new ApiError(401, "Authentication required");
    }

    const raw = await request.json();
    const body = registerBodySchema.parse(raw);

    const { eventId } = body;
    const userId = authUser.$id;
    const userName = authUser.name || "";
    const userEmail = authUser.email;

    // Fetch the event
    let event: Record<string, unknown>;
    try {
      event = await adminDb.getDocument(
        DATABASE_ID,
        COLLECTIONS.EVENTS,
        eventId
      ) as unknown as Record<string, unknown>;
    } catch {
      throw new ApiError(404, "Event not found");
    }

    // Resolve event type (handle legacy types)
    const rawType = String(event.eventType || "");
    const eventType = resolveEventType(rawType);

    if (!isValidEventType(eventType)) {
      throw new ApiError(400, `Unsupported event type: ${rawType}`);
    }

    // Build EventContext for the orchestrator
    const eventContext: import("@/lib/events/registration/types").EventContext = {
      eventId,
      eventType: eventType as import("@/lib/events/types").EventType,
      title: String(event.title || ""),
      capacity: Number(event.capacity || 0),
      registered: Number(event.registered || 0),
      startDate: String(event.date || ""),
      endDate: String(event.endDate || event.date || ""),
      venue: String(event.venue || ""),
      isOnline: Boolean(event.isOnline),
      status: String(event.status || "upcoming"),
      extraData: event as Record<string, unknown>,
    };

    // Build the registration input based on the model
    const registrationInput: Record<string, unknown> = {
      eventId,
      userId,
      userName,
      userEmail,
      ...body.extraFields,
    };

    // Add model-specific fields
    if (body.mode === "create" && body.teamName) {
      registrationInput.teamName = body.teamName;
    }
    if (body.mode === "join" && body.inviteCode) {
      registrationInput.inviteCode = body.inviteCode;
    }
    if (body.tier) {
      registrationInput.tier = body.tier;
    }
    if (body.mode === "exhibitor" || body.mode === "visitor") {
      registrationInput.role = body.mode;
    }

    // Delegate to the orchestrator
    const result = await registerForEvent(registrationInput as any, eventContext);

    if (!result.success) {
      const statusMap: Record<string, number> = {
        already_registered: 200,
        event_full: 409,
      };
      // Use message for error detail
      const errorKey = result.message?.includes("already") ? "already_registered" : "";
      const status = statusMap[errorKey] || 400;

      if (errorKey === "already_registered") {
        return successResponse({
          message: "Already registered for this event",
          ticketId: result.ticketId,
        });
      }

      throw new ApiError(status, result.message || "Registration failed");
    }

    // Send confirmation email (background, non-blocking)
    try {
      await sendRegistrationEmail(userEmail, userName, result.ticketId || "", {
        title: String(event.title || ""),
        date: String(event.date || ""),
        time: String(event.time || ""),
        venue: String(event.venue || ""),
        location: String(event.location || ""),
        image: String(event.image || ""),
        organizerName: String(event.organizerName || ""),
        price: Number(event.price || 0),
        discountPrice: Number(event.discountPrice || 0),
      });
    } catch (emailError) {
      console.warn(`[API] Failed to send registration email: ${emailError}`);
    }

    return successResponse({
      message: result.status === "waitlisted"
        ? "Application submitted — pending approval"
        : result.status === "pending_payment"
          ? "Registration pending payment"
          : "Registration successful",
      ticketId: result.ticketId,
      status: result.status,
      teamId: result.teamId,
      inviteCode: result.inviteCode,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/events/register");
  }
}

/**
 * DELETE /api/events/register
 *
 * Cancel a registration. Delegates to the orchestrator.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { authenticated, user: authUser } = await verifyAuth(request);
    if (!authenticated || !authUser) {
      throw new ApiError(401, "Authentication required");
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      throw new ApiError(400, "eventId is required");
    }

    // Fetch event to get type
    let event: Record<string, unknown>;
    try {
      event = await adminDb.getDocument(
        DATABASE_ID,
        COLLECTIONS.EVENTS,
        eventId
      ) as unknown as Record<string, unknown>;
    } catch {
      throw new ApiError(404, "Event not found");
    }

    const rawType = String(event.eventType || "");
    const eventType = resolveEventType(rawType);

    if (!isValidEventType(eventType)) {
      throw new ApiError(400, `Unsupported event type: ${rawType}`);
    }

    // Build EventContext for cancel
    const eventContext: import("@/lib/events/registration/types").EventContext = {
      eventId,
      eventType: eventType as import("@/lib/events/types").EventType,
      title: String(event.title || ""),
      capacity: Number(event.capacity || 0),
      registered: Number(event.registered || 0),
      startDate: String(event.date || ""),
      endDate: String(event.endDate || event.date || ""),
      venue: String(event.venue || ""),
      isOnline: Boolean(event.isOnline),
      status: String(event.status || "upcoming"),
      extraData: event as Record<string, unknown>,
    };

    // Find user's registration for this event
    const regs = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.REGISTRATIONS,
      [
        Query.equal("eventId", eventId),
        Query.equal("userId", authUser.$id),
      ]
    );

    if (regs.total === 0) {
      throw new ApiError(404, "No registration found");
    }

    await cancelRegistration(regs.documents[0].$id, eventContext);

    return successResponse({ message: "Registration cancelled" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/events/register");
  }
}
