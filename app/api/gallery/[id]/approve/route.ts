import { NextRequest, NextResponse } from "next/server";
import { galleryService } from "@/lib/database";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { handleApiError, successResponse, ApiError } from "@/lib/apiErrorHandler";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const { id } = await params;
    const image = await galleryService.approveImage(id);

    return successResponse({ image, message: "Gallery image approved successfully" });
  } catch (error) {
    return handleApiError(error, "POST /api/gallery/[id]/approve");
  }
}
