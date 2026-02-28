// app/api/events/documents/route.ts
import { NextRequest, NextResponse } from "next/server";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = "event_documents";

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

// GET /api/events/documents?eventId=xxx
export async function GET(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    const query = encodeURIComponent(`{"method":"equal","attribute":"eventId","values":["${eventId}"]}`);
    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?queries[]=${query}`
    );

    if (!res.ok) {
      return NextResponse.json({ documents: [] });
    }

    const data = await res.json();
    const sorted = (data.documents || []).sort(
      (a: any, b: any) => (a.order || 0) - (b.order || 0)
    );
    return NextResponse.json({ documents: sorted });
  } catch {
    return NextResponse.json({ documents: [] });
  }
}

// POST /api/events/documents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, type, title, content, fileUrl, isRequired, isPublic, order } = body;

    if (!eventId || !type || !title) {
      return NextResponse.json(
        { error: "eventId, type, and title are required" },
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
            type,
            title,
            content: content || null,
            fileUrl: fileUrl || null,
            isRequired: isRequired || false,
            isPublic: isPublic !== undefined ? isPublic : true,
            order: order || 0,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const doc = await res.json();
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
