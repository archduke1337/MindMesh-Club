import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { getErrorMessage } from "@/lib/errorHandler";
import { isUserAdminByEmail } from "@/lib/adminConfig";
import { account } from "@/lib/appwrite";

// Helper to verify admin via server-side session + cookie forwarding
async function verifyAdmin(request: NextRequest): Promise<{ isAdmin: boolean; email?: string; error?: string }> {
  try {
    // Try server-side session validation first
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      if (endpoint && projectId) {
        const res = await fetch(`${endpoint}/account`, {
          headers: {
            "X-Appwrite-Project": projectId,
            "Cookie": cookieHeader,
          },
        });
        if (res.ok) {
          const user = await res.json();
          const email = user.email;
          if (isUserAdminByEmail(email)) {
            return { isAdmin: true, email };
          }
          return { isAdmin: false, error: `Not authorized - '${email}' is not an admin.` };
        }
      }
    }
    // Fallback: use x-user-email header (less secure, for backward compatibility)
    const userEmail = request.headers.get("x-user-email");
    if (userEmail && isUserAdminByEmail(userEmail)) {
      return { isAdmin: true, email: userEmail };
    }
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

    console.log("[Approve] Admin verified! Approving blog:", params.id);
    const blog = await blogService.approveBlog(params.id);

    return NextResponse.json({
      success: true,
      data: blog,
      message: "Blog approved successfully",
    });
  } catch (error) {
    console.error("[Approve] Error approving blog:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
