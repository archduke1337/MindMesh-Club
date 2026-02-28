import { NextRequest, NextResponse } from "next/server";
import { galleryService } from "@/lib/database";
import { getErrorMessage } from "@/lib/errorHandler";
import { verifyAuth, verifyAdminAuth } from "@/lib/apiAuth";

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
    // Verify authentication via centralized auth
    const { authenticated, user } = await verifyAuth(request);
    if (!authenticated || !user) {
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

    // Check if user is admin — only admins can pre-approve
    const { isAdmin } = await verifyAdminAuth(request);

    const image = await galleryService.createImage({
      title: data.title,
      description: data.description || "",
      imageUrl: data.imageUrl,
      category: data.category,
      date: data.date,
      attendees: data.attendees || 0,
      uploadedBy: user.$id, // Use server-verified identity
      isApproved: isAdmin ? (data.isApproved ?? false) : false, // Non-admins always false
      isFeatured: isAdmin ? (data.isFeatured ?? false) : false,
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
