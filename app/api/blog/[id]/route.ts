import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { verifyAuth, verifyAdminAuth } from "@/lib/apiAuth";
import { handleApiError, validateRequestBody, successResponse, ApiError } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schema for blog updates
const updateBlogSchema = z.object({
  title: z.string().min(5).max(150).optional(),
  content: z.string().min(100).max(65536).optional(),
  excerpt: z.string().max(300).optional(),
  coverImage: z.string().url().optional(),
  category: z.string().min(1).optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  // Admin-only fields (will be filtered if not admin)
  status: z.enum(["draft", "pending", "published", "rejected"]).optional(),
  views: z.number().int().min(0).optional(),
  likes: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if it's a slug request (contains no hyphens at start) or ID
    const blog = await blogService.getBlogBySlug(id).catch(async () => {
      // If slug doesn't work, try to fetch by ID but this is limited
      throw new Error("Blog not found");
    });

    if (!blog) {
      throw new ApiError(404, "Blog not found", "BLOG_NOT_FOUND");
    }

    // Increment views
    if (blog.$id) {
      await blogService.incrementViews(blog.$id);
    }

    return successResponse(blog);
  } catch (error) {
    return handleApiError(error, "GET /api/blog/[id]");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verify user is authenticated before allowing updates
    const { authenticated, user } = await verifyAuth(request);
    if (!authenticated || !user) {
      throw new ApiError(401, "Authentication required");
    }

    const { isAdmin } = await verifyAdminAuth(request);

    // Verify ownership: only the author or an admin can edit
    const existingBlog = await blogService.getBlogBySlug(id).catch(() => null);
    if (existingBlog && existingBlog.authorEmail !== user.email) {
      if (!isAdmin) {
        throw new ApiError(403, "Not authorized — you can only edit your own blog posts", "UNAUTHORIZED");
      }
    }

    // Validate request body
    const data = await validateRequestBody(request, updateBlogSchema);

    // Prevent non-admins from updating sensitive fields
    if (!isAdmin) {
      delete data.status;
      delete data.views;
      delete data.likes;
      delete data.featured;
    }

    // Normalize tags to string format (blogService expects string)
    const updateData = {
      ...data,
      ...(data.tags && { tags: Array.isArray(data.tags) ? data.tags.join(", ") : data.tags }),
    };

    const blog = await blogService.updateBlog(id, updateData);

    return successResponse({ blog, message: "Blog updated successfully" });
  } catch (error) {
    return handleApiError(error, "PATCH /api/blog/[id]");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }
    
    await blogService.deleteBlog(id);

    return successResponse({ message: "Blog deleted successfully" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/blog/[id]");
  }
}
