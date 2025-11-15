import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { getErrorMessage } from "@/lib/errorHandler";
import { isUserAdminByEmail } from "@/lib/adminConfig";

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
    // Get user email from request headers (sent by client)
    const userEmail = request.headers.get("x-user-email");
    
    console.log("[Delete] Received email header:", userEmail ? `${userEmail.substring(0, 3)}***` : "MISSING");
    
    if (!userEmail) {
      console.error("[Delete] No email header provided");
      return NextResponse.json(
        { 
          success: false, 
          error: "Not authenticated - missing user email. Please ensure you're logged in."
        },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = isUserAdminByEmail(userEmail);
    console.log("[Delete] Admin check result:", isAdmin);
    
    if (!isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Not authorized - only admins can delete blogs.`
        },
        { status: 403 }
      );
    }

    console.log("[Delete] Admin verified! Deleting blog:", params.id);
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
