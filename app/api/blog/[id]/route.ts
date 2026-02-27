import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { getErrorMessage } from "@/lib/errorHandler";
import { isUserAdminByEmail } from "@/lib/adminConfig";

// Helper to verify admin via server-side session
async function verifyAdmin(request: NextRequest): Promise<{ isAdmin: boolean; email?: string; error?: string }> {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      if (endpoint && projectId) {
        const res = await fetch(`${endpoint}/account`, {
          headers: { "X-Appwrite-Project": projectId, "Cookie": cookieHeader },
        });
        if (res.ok) {
          const user = await res.json();
          if (isUserAdminByEmail(user.email)) return { isAdmin: true, email: user.email };
          return { isAdmin: false, error: "Not authorized - admin access required" };
        }
      }
    }
    const userEmail = request.headers.get("x-user-email");
    if (userEmail && isUserAdminByEmail(userEmail)) return { isAdmin: true, email: userEmail };
    return { isAdmin: false, error: "Not authenticated" };
  } catch {
    return { isAdmin: false, error: "Authentication failed" };
  }
}

// Helper to verify authenticated user via session
async function verifyUser(request: NextRequest): Promise<{ authenticated: boolean; email?: string }> {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      if (endpoint && projectId) {
        const res = await fetch(`${endpoint}/account`, {
          headers: { "X-Appwrite-Project": projectId, "Cookie": cookieHeader },
        });
        if (res.ok) {
          const user = await res.json();
          return { authenticated: true, email: user.email };
        }
      }
    }
    return { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}

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
    // Verify user is authenticated before allowing updates
    const { authenticated } = await verifyUser(request);
    if (!authenticated) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

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
    const { isAdmin, email, error } = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: error || "Not authorized" },
        { status: email ? 403 : 401 }
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
