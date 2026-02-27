import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { getErrorMessage } from "@/lib/errorHandler";
import { isUserAdminByEmail } from "@/lib/adminConfig";

// Helper to verify admin via server-side session cookie forwarding
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
    return { isAdmin: false, error: "Not authenticated" };
  } catch {
    return { isAdmin: false, error: "Authentication failed" };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization via cookie-based session
    const { isAdmin, email, error: authError } = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: authError || "Not authorized" },
        { status: email ? 403 : 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    let blogs;

    if (status === "pending") {
      blogs = await blogService.getPendingBlogs();
    } else {
      blogs = await blogService.getAllBlogs();
    }

    return NextResponse.json({
      success: true,
      data: blogs,
      total: blogs.length,
    });
  } catch (error) {
    console.error("Admin blog API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
