// app/api/admin/resources/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { handleApiError, validateRequestBody, successResponse, ApiError } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schemas
const createResourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  type: z.enum(["link", "file", "video", "document"]).default("link"),
  category: z.string().default("General"),
  url: z.string().url("Invalid URL").optional(),
  fileUrl: z.string().url("Invalid file URL").optional(),
  eventId: z.string().optional(),
  eventName: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  tags: z.array(z.string()).default([]),
  uploadedBy: z.string().default(""),
  isApproved: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

const updateResourceSchema = createResourceSchema.partial();

// GET all resources
export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const data = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, [
      Query.limit(100),
    ]);
    return successResponse({ resources: data.documents || [] });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/resources");
  }
}

// POST create resource
export async function POST(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const data = await validateRequestBody(request, createResourceSchema);

    const resource = await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.RESOURCES,
      ID.unique(),
      {
        title: data.title,
        description: data.description || null,
        type: data.type,
        category: data.category,
        url: data.url || null,
        fileUrl: data.fileUrl || null,
        eventId: data.eventId || null,
        eventName: data.eventName || null,
        difficulty: data.difficulty,
        tags: data.tags,
        uploadedBy: data.uploadedBy,
        isApproved: data.isApproved,
        isFeatured: data.isFeatured,
      }
    );

    return successResponse({ resource, message: "Resource created successfully" }, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/admin/resources");
  }
}

// PATCH update resource
export async function PATCH(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      throw new ApiError(400, "Missing id parameter");
    }

    const data = await validateRequestBody(request, updateResourceSchema);

    const resource = await adminDb.updateDocument(
      DATABASE_ID,
      COLLECTIONS.RESOURCES,
      id,
      {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.type && { type: data.type }),
        ...(data.category && { category: data.category }),
        ...(data.url !== undefined && { url: data.url || null }),
        ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl || null }),
        ...(data.eventId !== undefined && { eventId: data.eventId || null }),
        ...(data.eventName !== undefined && { eventName: data.eventName || null }),
        ...(data.difficulty && { difficulty: data.difficulty }),
        ...(data.tags && { tags: data.tags }),
        ...(data.uploadedBy !== undefined && { uploadedBy: data.uploadedBy }),
        ...(data.isApproved !== undefined && { isApproved: data.isApproved }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      }
    );

    return successResponse({ resource, message: "Resource updated successfully" });
  } catch (error) {
    return handleApiError(error, "PATCH /api/admin/resources");
  }
}

// DELETE resource
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      throw new ApiError(400, "Missing id parameter");
    }

    await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.RESOURCES, id);

    return successResponse({ message: "Resource deleted successfully" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/resources");
  }
}
