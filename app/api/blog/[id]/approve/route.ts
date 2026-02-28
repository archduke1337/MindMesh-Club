import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { handleApiError, successResponse, ApiError } from "@/lib/apiErrorHandler";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isAdmin } = await verifyAdminAuth(request);
    
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const blog = await blogService.approveBlog(id);

    return successResponse({ blog, message: "Blog approved successfully" });
  } catch (error) {
    return handleApiError(error, "POST /api/blog/[id]/approve");
  }
}
