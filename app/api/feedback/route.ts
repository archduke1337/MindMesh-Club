// app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";

// GET /api/feedback?eventId=xxx
export async function GET(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get("eventId");

    const queries: string[] = eventId
      ? [Query.equal("eventId", eventId)]
      : [];

    const result = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.FEEDBACK, queries);

    return NextResponse.json({ feedback: result.documents });
  } catch {
    return NextResponse.json({ feedback: [] });
  }
}

// POST /api/feedback
export async function POST(request: NextRequest) {
  const { authenticated, user: authUser } = await verifyAuth(request);
  if (!authenticated || !authUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const {
      eventId, userId, userName, userEmail,
      rating, feedback, suggestions, category, isAnonymous,
    } = body;

    if (!eventId || !rating || !feedback) {
      return NextResponse.json(
        { error: "Missing: eventId, rating, feedback" },
        { status: 400 }
      );
    }

    // Use authenticated user data instead of request body to prevent spoofing
    const verifiedUserId = authUser.$id;
    const verifiedUserName = isAnonymous ? "Anonymous" : (userName || authUser.name);
    const verifiedUserEmail = authUser.email;

    // Check for duplicate
    const existing = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.FEEDBACK, [
      Query.equal("eventId", eventId),
      Query.equal("userId", verifiedUserId),
    ]);
    if (existing.total > 0) {
      return NextResponse.json(
        { error: "You have already submitted feedback for this event" },
        { status: 409 }
      );
    }

    // Validate rating is a number between 1-5
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    const doc = await adminDb.createDocument(DATABASE_ID, COLLECTIONS.FEEDBACK, ID.unique(), {
      eventId,
      userId: verifiedUserId,
      userName: verifiedUserName,
      userEmail: verifiedUserEmail,
      rating: ratingNum,
      feedback,
      suggestions: suggestions || null,
      category: category || "general",
      isAnonymous: isAnonymous || false,
      isResolved: false,
      adminResponse: null,
    });

    return NextResponse.json({ success: true, feedback: doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
