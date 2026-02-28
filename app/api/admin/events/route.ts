// app/api/admin/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { createAdminDatabases } from "@/lib/appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
const EVENTS_COLLECTION_ID = "events";

/**
 * DELETE /api/admin/events
 * Body: { eventId: string } — delete a single event
 *   OR: { deletePast: true }  — delete all past events
 */
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin, error } = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const adminDb = createAdminDatabases();

    // Delete all past events
    if (body.deletePast === true) {
      const today = new Date().toISOString().split("T")[0];
      const response = await adminDb.listDocuments(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        [`lessThan("date", "${today}")`]
      );

      const docs = response.documents || [];
      await Promise.all(
        docs.map((doc: any) =>
          adminDb.deleteDocument(DATABASE_ID, EVENTS_COLLECTION_ID, doc.$id)
        )
      );

      return NextResponse.json({ deleted: docs.length });
    }

    // Delete a single event
    const { eventId } = body;
    if (!eventId || typeof eventId !== "string") {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    await adminDb.deleteDocument(DATABASE_ID, EVENTS_COLLECTION_ID, eventId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Admin Events DELETE]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete event" },
      { status: 500 }
    );
  }
}
