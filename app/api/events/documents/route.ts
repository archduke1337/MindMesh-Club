// app/api/events/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, verifyAdminAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { getErrorMessage } from "@/lib/errorHandler";

// GET /api/events/documents?eventId=xxx
export async function GET(request: NextRequest) {
  try {
    // Require authentication to view event documents
    const { authenticated, error: authError } = await verifyAuth(request);
    if (!authenticated) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: 401 });
    }

    const eventId = request.nextUrl.searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    const response = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENT_DOCUMENTS,
      [Query.equal("eventId", eventId)]
    );

    const sorted = (response.documents || []).sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) => ((a.order as number) || 0) - ((b.order as number) || 0)
    );
    return NextResponse.json({ documents: sorted });
  } catch (err: unknown) {
    console.error("[Events Documents GET]", getErrorMessage(err));
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

// POST /api/events/documents
export async function POST(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Admin access required" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { eventId, type, title, content, fileUrl, isRequired, isPublic, order } = body;

    if (!eventId || !type || !title) {
      return NextResponse.json(
        { error: "eventId, type, and title are required" },
        { status: 400 }
      );
    }

    const doc = await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.EVENT_DOCUMENTS,
      ID.unique(),
      {
        eventId,
        type,
        title,
        content: content || null,
        fileUrl: fileUrl || null,
        isRequired: isRequired || false,
        isPublic: isPublic !== undefined ? isPublic : true,
        order: order || 0,
      }
    );

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error: unknown) {
    console.error("[Events Documents POST]", getErrorMessage(error));
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
