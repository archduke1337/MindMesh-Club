// app/api/admin/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";
import { getErrorMessage } from "@/lib/errorHandler";

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

      return NextResponse.json({ deleted: docs.length });
    }

    // Delete a single event
    const { eventId } = body;
    if (!eventId || typeof eventId !== "string") {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[Admin Events DELETE]", err);
    return NextResponse.json(
      { error: getErrorMessage(err) },
      { status: 500 }
    );
  }
}
