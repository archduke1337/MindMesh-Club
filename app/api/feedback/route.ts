// app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { adminFetch } from "@/lib/adminApi";
import { DATABASE_ID, COLLECTION_IDS } from "@/lib/types/appwrite";

const COLLECTION_ID = COLLECTION_IDS.FEEDBACK;

// GET /api/feedback?eventId=xxx
export async function GET(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get("eventId");

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`
    );
    if (!res.ok) {
      return NextResponse.json({ feedback: [] });
    }

    const data = await res.json();
    let items = data.documents || [];

    if (eventId) {
      items = items.filter((f: any) => f.eventId === eventId);
    }

    return NextResponse.json({ feedback: items });
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
    const existingRes = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`
    );
    const existingData = await existingRes.json();
    const duplicate = (existingData.documents || []).find(
      (f: any) => f.eventId === eventId && f.userId === verifiedUserId
    );
    if (duplicate) {
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

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
      {
        method: "POST",
        body: JSON.stringify({
          documentId: "unique()",
          data: {
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
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const doc = await res.json();
    return NextResponse.json({ success: true, feedback: doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
