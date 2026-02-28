import { NextRequest, NextResponse } from "next/server";
import { galleryService } from "@/lib/database";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { handleApiError, validateRequestBody, successResponse, ApiError } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schema for gallery image updates
const updateGallerySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum(["events", "workshops", "hackathons", "team", "projects", "campus", "achievements"]).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  featured: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const image = await galleryService.getImageById(id);

    return successResponse(image);
  } catch (error) {
    return handleApiError(error, "GET /api/gallery/[id]");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authorization
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const { id } = await params;
    const data = await validateRequestBody(request, updateGallerySchema);

    const image = await galleryService.updateImage(id, data);

    return successResponse({ image, message: "Gallery image updated successfully" });
  } catch (error) {
    return handleApiError(error, "PATCH /api/gallery/[id]");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authorization
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const { id } = await params;
    await galleryService.deleteImage(id);

    return successResponse({ message: "Gallery image deleted successfully" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/gallery/[id]");
  }
}
