// app/api/admin/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";
import { handleApiError, validateRequestBody, successResponse, ApiError } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schema
const deleteEventsSchema = z.object({
  deletePast: z.boolean().optional(),
  eventId: z.string().optional(),
}).refine(data => data.deletePast === true || !!data.eventId, {
  message: "Either deletePast must be true or eventId must be provided",
});

/**
 * DELETE /api/admin/events
 * Body: { eventId: string } — delete a single event
 *   OR: { deletePast: true }  — delete all past events
 */
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const body = await validateRequestBody(request, deleteEventsSchema);

    // Delete all past events
    if (body.deletePast === true) {
      const today = new Date().toISOString().split("T")[0];
      const response = await adminDb.listDocuments(
        DATABASE_ID,
        COLLECTIONS.EVENTS,
        [Query.lessThan("date", today)]
      );

      const docs = response.documents || [];
      await Promise.all(
        docs.map((doc) =>
          adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.EVENTS, doc.$id)
        )
      );

      return successResponse({ deleted: docs.length, message: `Deleted ${docs.length} past events` });
    }

    // Delete a single event
    if (body.eventId) {
      await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.EVENTS, body.eventId);
      return successResponse({ message: "Event deleted successfully" });
    }

    throw new ApiError(400, "Either deletePast or eventId must be provided");
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/events");
  }
}
