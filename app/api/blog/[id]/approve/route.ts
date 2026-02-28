import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { getErrorMessage } from "@/lib/errorHandler";
import { verifyAdminAuth } from "@/lib/apiAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isAdmin, user, error } = await verifyAdminAuth(request);
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: error || "Not authorized" },
        { status: user ? 403 : 401 }
      );
    }

    const blog = await blogService.approveBlog(id);

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
