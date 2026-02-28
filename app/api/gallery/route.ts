import { NextRequest, NextResponse } from "next/server";
import { galleryService } from "@/lib/database";
import { verifyAuth, verifyAdminAuth } from "@/lib/apiAuth";
import { handleApiError, ApiError, successResponse, validateRequestBody } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schema for gallery image creation
const createGallerySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  imageUrl: z.string().url("Invalid image URL"),
  category: z.enum(['events', 'workshops', 'hackathons', 'team', 'projects', 'campus', 'achievements']),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
  attendees: z.number().int().min(0).default(0),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").default([]),
  eventId: z.string().optional(),
  isApproved: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

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

    return successResponse({ images, total: images.length });
  } catch (error) {
    return handleApiError(error, "GET /api/gallery");
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user } = await verifyAuth(request);
    if (!authenticated || !user) {
      throw new ApiError(401, "Authentication required to upload gallery images");
    }

    // Validate request body
    const data = await validateRequestBody(request, createGallerySchema);

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

    return successResponse({ image, message: "Gallery image created successfully" }, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/gallery");
  }
}
