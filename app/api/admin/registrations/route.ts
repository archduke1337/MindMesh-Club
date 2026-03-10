// app/api/admin/registrations/route.ts
import { NextRequest } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";
import { handleApiError, successResponse, ApiError } from "@/lib/apiErrorHandler";

/**
 * GET /api/admin/registrations?eventId=xxx&status=pending
 * List registrations with optional filters.
 */
export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");

    const queries: string[] = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc("$createdAt"),
    ];

    if (eventId) {
      queries.push(Query.equal("eventId", eventId));
    }
    if (status) {
      queries.push(Query.equal("status", status));
    }

    const result = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.REGISTRATIONS,
      queries
    );

    return successResponse({
      registrations: result.documents,
      total: result.total,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/registrations");
  }
}
