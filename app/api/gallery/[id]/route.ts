import { NextRequest, NextResponse } from "next/server";
import { galleryService } from "@/lib/database";
import { getErrorMessage } from "@/lib/errorHandler";
import { verifyAdminAuth } from "@/lib/apiAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const image = await galleryService.getImageById(id);

    return NextResponse.json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error("Error fetching gallery image:", error);
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
    // Verify admin authorization
    const { isAdmin, email, error: authError } = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: authError || "Not authorized" },
        { status: email ? 403 : 401 }
      );
    }

    const { id } = await params;
    const data = await request.json();

    const image = await galleryService.updateImage(id, data);

    return NextResponse.json({
      success: true,
      data: image,
      message: "Gallery image updated successfully",
    });
  } catch (error) {
    console.error("Error updating gallery image:", error);
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
    // Verify admin authorization
    const { isAdmin, email, error: authError } = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: authError || "Not authorized" },
        { status: email ? 403 : 401 }
      );
    }

    const { id } = await params;
    await galleryService.deleteImage(id);

    return NextResponse.json({
      success: true,
      message: "Gallery image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting gallery image:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
