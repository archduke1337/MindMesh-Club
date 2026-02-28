import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { adminDb, DATABASE_ID, COLLECTIONS, ID } from "@/lib/appwrite/server";
import { checkBlogRateLimit, getRemainingSubmissions } from "@/lib/rateLimiter";
import { verifyAuth } from "@/lib/apiAuth";
import { handleApiError, validateRequestBody, successResponse, ApiError } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schema for blog creation
const createBlogSchema = z.object({
  title: z.string()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Title must be less than 150 characters"),
  content: z.string()
    .min(100, "Content must be at least 100 characters")
    .max(65536, "Content exceeds maximum length of 65536 characters"),
  excerpt: z.string()
    .max(300, "Excerpt must be less than 300 characters")
    .optional(),
  coverImage: z.string().url("Invalid cover image URL").optional(),
  category: z.string().min(1, "Category is required").default("other"),
  tags: z.union([
    z.array(z.string()),
    z.string()
  ]).optional(),
  authorName: z.string().optional(),
  authorAvatar: z.string().url("Invalid avatar URL").optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Cap at 100

    let blogs: unknown[] = [];

    if (featured === "true") {
      blogs = await blogService.getFeaturedBlogs(limit);
    } else if (category && category !== "all") {
      blogs = await blogService.getBlogsByCategory(category, limit);
    } else {
      blogs = await blogService.getPublishedBlogs(limit);
    }

    return successResponse({ blogs, total: blogs.length });
  } catch (error) {
    return handleApiError(error, "GET /api/blog");
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication via session cookie
    const { authenticated, user: authUser } = await verifyAuth(request);
    if (!authenticated || !authUser) {
      throw new ApiError(401, "Authentication required. You must be logged in to create a blog.");
    }

    // Validate request body
    const data = await validateRequestBody(request, createBlogSchema);

    // Use server-verified identity
    const authorId = authUser.$id;
    const authorEmail = authUser.email;
    const authorName = data.authorName || authUser.name || "Anonymous";

    // Check rate limit (max 5 blogs per 24 hours)
    if (!(await checkBlogRateLimit(authorId))) {
      const remaining = await getRemainingSubmissions(authorId);
      throw new ApiError(
        429,
        `Rate limit exceeded. You have ${remaining} submissions remaining. Try again later.`,
        "RATE_LIMIT_EXCEEDED"
      );
    }

    // Generate slug and calculate read time
    const slug = blogService.generateSlug(data.title);
    const readTime = blogService.calculateReadTime(data.content);

    // Create blog document
    const blog = await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.BLOG,
      ID.unique(),
      {
        title: data.title,
        slug,
        excerpt: data.excerpt || data.content.substring(0, 150),
        content: data.content,
        coverImage: data.coverImage || "",
        category: data.category,
        tags: Array.isArray(data.tags) ? data.tags.join(", ") : (data.tags || ""),
        authorId,
        authorName,
        authorEmail,
        authorAvatar: data.authorAvatar || "",
        status: "pending",
        views: 0,
        likes: 0,
        featured: false,
        readTime,
      }
    );

    return successResponse(
      { blog, message: "Blog created successfully and pending approval" },
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/blog");
  }
}
