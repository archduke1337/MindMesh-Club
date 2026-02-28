// app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = "feedback";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
    "X-Appwrite-Key": process.env.APPWRITE_API_KEY!,
  };
}

function getEndpoint() {
  return process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
}

async function adminFetch(path: string, options: RequestInit = {}) {
  return fetch(`${getEndpoint()}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers as Record<string, string> || {}) },
  });
}

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
  try {
    const body = await request.json();
    const {
      eventId, userId, userName, userEmail,
      rating, feedback, suggestions, category, isAnonymous,
    } = body;

    if (!eventId || !userId || !rating || !feedback) {
      return NextResponse.json(
        { error: "Missing: eventId, userId, rating, feedback" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existingRes = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`
    );
    const existingData = await existingRes.json();
    const duplicate = (existingData.documents || []).find(
      (f: any) => f.eventId === eventId && f.userId === userId
    );
    if (duplicate) {
      return NextResponse.json(
        { error: "You have already submitted feedback for this event" },
        { status: 409 }
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
            userId,
            userName: isAnonymous ? "Anonymous" : userName,
            userEmail,
            rating,
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
