// app/api/announcements/route.ts
// Announcements API — GET active announcements, POST/DELETE for admins
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID } from "@/lib/appwrite/server";
import { announcementSchema } from "@/lib/validation/schemas";
import { handleApiError, ApiError, successResponse, validateRequestBody } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Update schema for PATCH
const updateAnnouncementSchema = z.object({
  announcementId: z.string().min(1, "Announcement ID is required"),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(2000).optional(),
  type: z.enum(['info', 'event', 'urgent', 'update']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  isPinned: z.boolean().optional(),
  isActive: z.boolean().optional(),
  link: z.string().url().optional().nullable(),
  linkText: z.string().max(100).optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

const deleteAnnouncementSchema = z.object({
  announcementId: z.string().min(1, "Announcement ID is required"),
});

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
        return successResponse({ announcements: documents });
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

    return successResponse({ announcements: active });
  } catch (error: unknown) {
    return handleApiError(error, "GET /api/announcements");
  }
}

// POST /api/announcements — Create announcement (admin)
export async function POST(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    throw new ApiError(403, error || "Not authorized");
  }
  
  try {
    const validated = await validateRequestBody(request, announcementSchema);

    // Build document data
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

    return successResponse({ announcement }, 201);
  } catch (error: unknown) {
    return handleApiError(error, "POST /api/announcements");
  }
}

// PATCH /api/announcements — Update announcement (admin)
export async function PATCH(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    throw new ApiError(403, error || "Not authorized");
  }
  
  try {
    const body = await validateRequestBody(request, updateAnnouncementSchema);
    const { announcementId, ...updateFields } = body;

    const announcement = await adminDb.updateDocument(
      DATABASE_ID,
      COLLECTIONS.ANNOUNCEMENTS,
      announcementId,
      updateFields
    );

    return successResponse({ announcement });
  } catch (error: unknown) {
    return handleApiError(error, "PATCH /api/announcements");
  }
}

// DELETE /api/announcements — Delete announcement (admin)
export async function DELETE(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    throw new ApiError(403, error || "Not authorized");
  }
  
  try {
    const { announcementId } = await validateRequestBody(request, deleteAnnouncementSchema);

    await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.ANNOUNCEMENTS, announcementId);

    return successResponse({ message: "Announcement deleted successfully" });
  } catch (error: unknown) {
    return handleApiError(error, "DELETE /api/announcements");
  }
}
