import { NextRequest, NextResponse } from "next/server";
import { galleryService } from "@/lib/database";
import { getErrorMessage } from "@/lib/errorHandler";
import { isUserAdminByEmail } from "@/lib/adminConfig";

// Helper to verify authenticated user via session
async function verifyUser(request: NextRequest): Promise<{ authenticated: boolean; email?: string }> {
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
          return { authenticated: true, email: user.email };
        }
      }
    }
    return { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");

    let images;

    if (featured === "true") {
      images = await galleryService.getFeaturedImages();
    } else if (category && category !== "all") {
      images = await galleryService.getImagesByCategory(category);
    } else {
      images = await galleryService.getApprovedImages();
    }

    return NextResponse.json({
      success: true,
      data: images,
      total: images.length,
    });
  } catch (error) {
    console.error("Gallery API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication before allowing upload
    const { authenticated } = await verifyUser(request);
    if (!authenticated) {
      return NextResponse.json(
        { success: false, error: "Authentication required to upload gallery images" },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.imageUrl || !data.category || !data.date) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, imageUrl, category, date",
        },
        { status: 400 }
      );
    }

    const image = await galleryService.createImage({
      title: data.title,
      description: data.description || "",
      imageUrl: data.imageUrl,
      category: data.category,
      date: data.date,
      attendees: data.attendees || 0,
      uploadedBy: data.uploadedBy || "anonymous",
      isApproved: data.isApproved || false,
      isFeatured: data.isFeatured || false,
      tags: data.tags || [],
      eventId: data.eventId,
    });

    return NextResponse.json(
      {
        success: true,
        data: image,
        message: "Gallery image created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating gallery image:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
