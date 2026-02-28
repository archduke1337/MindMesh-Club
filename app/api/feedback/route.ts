// app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { handleApiError, validateRequestBody, successResponse, ApiError } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schema
const createFeedbackSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  feedback: z.string().min(10, "Feedback must be at least 10 characters").max(2000, "Feedback too long"),
  suggestions: z.string().max(2000, "Suggestions too long").optional(),
  category: z.string().default("general"),
  isAnonymous: z.boolean().default(false),
  // These fields will be overridden with authenticated user data
  userId: z.string().optional(),
  userName: z.string().optional(),
  userEmail: z.string().optional(),
});

// GET /api/feedback?eventId=xxx
export async function GET(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get("eventId");

    const queries: string[] = eventId
      ? [Query.equal("eventId", eventId)]
      : [];

    const result = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.FEEDBACK, queries);

    return successResponse({ feedback: result.documents });
  } catch (error) {
    return handleApiError(error, "GET /api/feedback");
  }
}

// POST /api/feedback
export async function POST(request: NextRequest) {
  try {
    const { authenticated, user: authUser } = await verifyAuth(request);
    if (!authenticated || !authUser) {
      throw new ApiError(401, "Authentication required");
    }

    // Validate request body
    const data = await validateRequestBody(request, createFeedbackSchema);

    // Use authenticated user data instead of request body to prevent spoofing
    const verifiedUserId = authUser.$id;
    const verifiedUserName = data.isAnonymous ? "Anonymous" : (data.userName || authUser.name);
    const verifiedUserEmail = authUser.email;

    // Check for duplicate
    const existing = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.FEEDBACK, [
      Query.equal("eventId", data.eventId),
      Query.equal("userId", verifiedUserId),
    ]);
    if (existing.total > 0) {
      throw new ApiError(409, "You have already submitted feedback for this event", "DUPLICATE_FEEDBACK");
    }

    const doc = await adminDb.createDocument(DATABASE_ID, COLLECTIONS.FEEDBACK, ID.unique(), {
      eventId: data.eventId,
      userId: verifiedUserId,
      userName: verifiedUserName,
      userEmail: verifiedUserEmail,
      rating: data.rating,
      feedback: data.feedback,
      suggestions: data.suggestions || null,
      category: data.category,
      isAnonymous: data.isAnonymous,
      isResolved: false,
      adminResponse: null,
    });

    return successResponse({ feedback: doc, message: "Feedback submitted successfully" }, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/feedback");
  }
}
