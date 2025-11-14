import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { getErrorMessage } from "@/lib/errorHandler";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if it's a slug request (contains no hyphens at start) or ID
    const blog = await blogService.getBlogBySlug(params.id).catch(async () => {
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
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const blog = await blogService.updateBlog(params.id, data);

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
  { params }: { params: { id: string } }
) {
  try {
    await blogService.deleteBlog(params.id);

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
