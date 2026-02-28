import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { handleApiError, validateRequestBody, successResponse, ApiError } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schema
const rejectBlogSchema = z.object({
  reason: z.string().min(10, "Rejection reason must be at least 10 characters").max(500, "Reason too long").default("No reason provided"),
});

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

    const data = await validateRequestBody(request, rejectBlogSchema);

    const blog = await blogService.rejectBlog(id, data.reason);

    return successResponse({ blog, message: "Blog rejected successfully" });
  } catch (error) {
    return handleApiError(error, "POST /api/blog/[id]/reject");
  }
}
