import { NextRequest, NextResponse } from "next/server";
import { galleryService } from "@/lib/database";
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
