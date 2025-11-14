import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/blog";
import { getErrorMessage } from "@/lib/errorHandler";
import { createAdminDatabases } from "@/lib/appwrite";
import { ID } from "appwrite";
import { DATABASE_ID, BLOGS_COLLECTION_ID } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "50");

    let blogs;

    if (featured === "true") {
      blogs = await blogService.getFeaturedBlogs(limit);
    } else if (category && category !== "all") {
      blogs = await blogService.getBlogsByCategory(category, limit);
    } else {
      blogs = await blogService.getPublishedBlogs(limit);
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
    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.content || !data.authorEmail) {
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

    // Use admin client for server-side database operations
    const adminDatabases = createAdminDatabases();

    const blog = await adminDatabases.createDocument(
      DATABASE_ID,
      BLOGS_COLLECTION_ID,
      ID.unique(),
      {
        title: data.title,
        slug,
        excerpt: data.excerpt || data.content.substring(0, 150),
        content: data.content,
        coverImage: data.coverImage || "",
        category: data.category || "other",
        tags: data.tags || [],
        authorId: data.authorId || "",
        authorName: data.authorName || "Anonymous",
        authorEmail: data.authorEmail,
        authorAvatar: data.authorAvatar,
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
