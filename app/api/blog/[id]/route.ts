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
    if (userEmail) {
      console.warn("[Security] x-user-email header is deprecated for admin auth. Use session cookies.");
    }
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
    const { authenticated, email } = await verifyUser(request);
    if (!authenticated || !email) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify ownership: only the author or an admin can edit
    const existingBlog = await blogService.getBlogBySlug(id).catch(() => null);
    if (existingBlog && existingBlog.authorEmail !== email) {
      // Check if user is admin
      const adminCheck = isUserAdminByEmail(email);
      if (!adminCheck) {
        return NextResponse.json(
          { success: false, error: "Not authorized — you can only edit your own blog posts" },
          { status: 403 }
        );
      }
    }

    const data = await request.json();

    // Prevent non-admins from updating sensitive fields
    if (!isUserAdminByEmail(email)) {
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
    const { isAdmin, email, error } = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: error || "Not authorized" },
        { status: email ? 403 : 401 }
      );
    }

    console.log("[Delete] Admin verified! Deleting blog:", id);
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
