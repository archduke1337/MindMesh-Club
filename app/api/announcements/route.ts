// app/api/announcements/route.ts
// Announcements API — GET active announcements, POST/DELETE for admins
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID } from "@/lib/appwrite/server";
import { announcementSchema } from "@/lib/validation/schemas";
import { getErrorMessage } from "@/lib/errorHandler";
import { handleZodError } from "@/lib/utils/errorHandling";

// GET /api/announcements — Active announcements (or all for admins with ?all=true)
export async function GET(request: NextRequest) {
  try {
    const data = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.ANNOUNCEMENTS);
    const documents = data.documents || [];

    // If admin requests all announcements (for admin panel)
    const showAll = request.nextUrl.searchParams.get("all") === "true";
    if (showAll) {
      const { isAdmin } = await verifyAdminAuth(request);
      if (isAdmin) {
        // Sort: pinned first, then by creation date
        documents.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.$createdAt as string).getTime() - new Date(a.$createdAt as string).getTime();
        });
        return NextResponse.json({ announcements: documents });
      }
    }

    const now = new Date().toISOString();

    // Filter active and not expired
    const active = documents.filter((a: Record<string, unknown>) => {
      if (!a.isActive) return false;
      if (a.expiresAt && (a.expiresAt as string) < now) return false;
      return true;
    });

    // Sort: pinned first, then by creation date
    active.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.$createdAt as string).getTime() - new Date(a.$createdAt as string).getTime();
    });

    return NextResponse.json({ announcements: active });
  } catch (error: unknown) {
    console.error("[API] Announcements GET error:", error);
    return NextResponse.json({ announcements: [] });
  }
}

// POST /api/announcements — Create announcement (admin)
export async function POST(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const body = await request.json();

    // Validate with Zod schema
    let validated;
    try {
      validated = announcementSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        return NextResponse.json(
          { error: handleZodError(validationError) },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Build document data — only include optional fields if they have values
    // to avoid Appwrite schema errors for attributes that may not exist
    const docData: Record<string, unknown> = {
      title: validated.title,
      content: validated.content,
      type: validated.type,
      priority: validated.priority,
      isPinned: validated.isPinned,
      isActive: true,
      createdBy: validated.createdBy,
    };
    if (validated.eventId) docData.eventId = validated.eventId;
    if (validated.link) docData.link = validated.link;
    if (validated.linkText) docData.linkText = validated.linkText;
    if (validated.expiresAt) docData.expiresAt = validated.expiresAt;

    const announcement = await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.ANNOUNCEMENTS,
      ID.unique(),
      docData
    );

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (error: unknown) {
    console.error("[API] Announcements POST error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// PATCH /api/announcements — Update announcement (admin)
export async function PATCH(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { announcementId, ...updateFields } = body;

    if (!announcementId) {
      return NextResponse.json({ error: "announcementId is required" }, { status: 400 });
    }

    // Whitelist allowed fields
    const allowed = ["title", "content", "type", "priority", "isPinned", "isActive", "link", "linkText", "expiresAt"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updateFields) {
        data[key] = updateFields[key];
      }
    }

    const announcement = await adminDb.updateDocument(
      DATABASE_ID,
      COLLECTIONS.ANNOUNCEMENTS,
      announcementId,
      data
    );

    return NextResponse.json({ success: true, announcement });
  } catch (error: unknown) {
    console.error("[API] Announcements PATCH error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// DELETE /api/announcements — Delete announcement (admin)
export async function DELETE(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const { announcementId } = await request.json();

    if (!announcementId) {
      return NextResponse.json({ error: "announcementId is required" }, { status: 400 });
    }

    await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.ANNOUNCEMENTS, announcementId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[API] Announcements DELETE error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
