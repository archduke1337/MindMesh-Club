import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { getErrorMessage } from "@/lib/errorHandler";
import { verifyAuth, verifyAdminAuth } from "@/lib/apiAuth";

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
      return NextResponse.json(
        {
          success: false,
          error: "Blog not found",
        },
        { status: 404 }
      );
    }

    // Increment views
    if (blog.$id) {
      await blogService.incrementViews(blog.$id);
    }

    return NextResponse.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 404 }
    );
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
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { isAdmin } = await verifyAdminAuth(request);

    // Verify ownership: only the author or an admin can edit
    const existingBlog = await blogService.getBlogBySlug(id).catch(() => null);
    if (existingBlog && existingBlog.authorEmail !== user.email) {
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: "Not authorized — you can only edit your own blog posts" },
          { status: 403 }
        );
      }
    }

    const data = await request.json();

    // Prevent non-admins from updating sensitive fields
    if (!isAdmin) {
      delete data.status;
      delete data.views;
      delete data.likes;
      delete data.featured;
    }

    const blog = await blogService.updateBlog(id, data);

    return NextResponse.json({
      success: true,
      data: blog,
      message: "Blog updated successfully",
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isAdmin: isAdminUser, user: adminUser, error } = await verifyAdminAuth(request);
    if (!isAdminUser) {
      return NextResponse.json(
        { success: false, error: error || "Not authorized" },
        { status: adminUser ? 403 : 401 }
      );
    }
    await blogService.deleteBlog(id);

    return NextResponse.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
