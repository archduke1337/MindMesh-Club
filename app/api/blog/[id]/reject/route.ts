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

    const data = await request.json();
    const reason = data.reason || "No reason provided";

    const blog = await blogService.rejectBlog(id, reason);

    return NextResponse.json({
      success: true,
      data: blog,
      message: "Blog rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting blog:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
