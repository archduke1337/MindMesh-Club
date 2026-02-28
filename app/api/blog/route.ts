import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { getErrorMessage } from "@/lib/errorHandler";
import { adminDb, DATABASE_ID, COLLECTIONS, ID } from "@/lib/appwrite/server";
import { checkBlogRateLimit, getRemainingSubmissions } from "@/lib/rateLimiter";
import { verifyAuth } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "50");

    let blogs: unknown[] = [];

    try {
      if (featured === "true") {
        blogs = await blogService.getFeaturedBlogs(limit);
      } else if (category && category !== "all") {
        blogs = await blogService.getBlogsByCategory(category, limit);
      } else {
        blogs = await blogService.getPublishedBlogs(limit);
      }
    } catch (error) {
      // Fallback to empty array if query fails
      console.error("Blog fetch error:", error);
      blogs = [];
    }

    return NextResponse.json({
      success: true,
      data: blogs,
      total: blogs.length,
    });
  } catch (error) {
    console.error("Blog API error:", error);
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
    // Verify authentication via session cookie
    const { authenticated, user: authUser } = await verifyAuth(request);
    if (!authenticated || !authUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required. You must be logged in to create a blog." },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Use server-verified identity
    const authorId = authUser.$id;
    const authorEmail = authUser.email;
    const authorName = data.authorName || authUser.name || "Anonymous";

    // Check rate limit (max 5 blogs per 24 hours)
    if (!(await checkBlogRateLimit(authorId))) {
      const remaining = await getRemainingSubmissions(authorId);
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. You have ${remaining} submissions remaining. Try again later.`,
        },
        { status: 429 }
      );
    }

    // Validate required fields
    if (!data.title || !data.content) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, content, authorEmail",
        },
        { status: 400 }
      );
    }

    // Generate slug and calculate read time
    const slug = blogService.generateSlug(data.title);
    const readTime = blogService.calculateReadTime(data.content);

    // Reject excessively long content to prevent truncation
    if (data.content.length > 65536) {
      return NextResponse.json(
        {
          success: false,
          error: "Blog content exceeds maximum length of 65536 characters.",
        },
        { status: 400 }
      );
    }

    // Use admin client for server-side database operations
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
        category: data.category || "other",
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

    return NextResponse.json(
      {
        success: true,
        data: blog,
        message: "Blog created successfully and pending approval",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
