import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { getErrorMessage } from "@/lib/errorHandler";
import { isUserAdminByEmail, ADMIN_EMAILS } from "@/lib/adminConfig";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user email from request headers (sent by client)
    const userEmail = request.headers.get("x-user-email");
    
    console.log("[Approve] Received email header:", userEmail ? `${userEmail.substring(0, 3)}***` : "MISSING");
    
    if (!userEmail) {
      console.error("[Approve] No email header provided");
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
    console.log("[Approve] Email check - Input:", userEmail, "IsAdmin:", isAdmin, "AllowedEmails:", ADMIN_EMAILS);
    
    if (!isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Not authorized - '${userEmail}' is not in admin list. Contact administrator to add your email.`
        },
        { status: 403 }
      );
    }

    const blog = await blogService.approveBlog(params.id);

    return NextResponse.json({
      success: true,
      data: blog,
      message: "Blog approved successfully",
    });
  } catch (error) {
    console.error("Error approving blog:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
