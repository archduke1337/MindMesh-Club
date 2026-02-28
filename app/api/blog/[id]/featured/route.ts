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
    const isFeatured = data.isFeatured ?? false;

    const blog = await blogService.updateBlog(id, {
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
