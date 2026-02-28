import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { handleApiError, validateRequestBody, successResponse, ApiError } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schema
const toggleFeaturedSchema = z.object({
  isFeatured: z.boolean().default(false),
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

    const data = await validateRequestBody(request, toggleFeaturedSchema);

    const blog = await blogService.updateBlog(id, {
      featured: data.isFeatured,
    });

    return successResponse({
      blog,
      message: `Blog ${data.isFeatured ? "marked as featured" : "removed from featured"}`,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/blog/[id]/featured");
  }
}
