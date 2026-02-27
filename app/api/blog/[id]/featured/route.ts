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

export async function POST(
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

    const data = await request.json();
    const isFeatured = data.isFeatured || false;

    const blog = await blogService.updateBlog(params.id, {
      featured: isFeatured,
    });

    return NextResponse.json({
      success: true,
      data: blog,
      message: `Blog ${isFeatured ? "marked as featured" : "removed from featured"}`,
    });
  } catch (error) {
    console.error("Error toggling featured:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
