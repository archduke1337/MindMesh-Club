import { NextRequest, NextResponse } from "next/server";
import { galleryService } from "@/lib/database";
import { getErrorMessage } from "@/lib/errorHandler";
import { verifyAdminAuth } from "@/lib/apiAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin, user, error: authError } = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: authError || "Not authorized" },
        { status: user ? 403 : 401 }
      );
    }

    const { id } = await params;
    const image = await galleryService.approveImage(id);

    return NextResponse.json({
      success: true,
      data: image,
      message: "Gallery image approved successfully",
    });
  } catch (error) {
    console.error("Error approving gallery image:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
