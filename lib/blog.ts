// lib/blogs.ts
import { ID, Query } from "appwrite";
import { databases, storage } from "./appwrite";
import { DATABASE_ID } from "./database";

// Re-export BLOGS_COLLECTION_ID from database.ts for consistency
import { BLOGS_COLLECTION_ID } from "./database";
export { BLOGS_COLLECTION_ID };
export const BLOG_IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_BLOG_IMAGES_BUCKET_ID || "6917a084000157e9e8f9";

// Helper to delete documents using admin API
const deleteDocumentAdmin = async (databaseId: string, collectionId: string, documentId: string) => {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    console.warn("[Blog] Admin API not available for delete, using regular client");
    return databases.deleteDocument(databaseId, collectionId, documentId);
  }

  const url = `${endpoint}/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`;
  
  console.log("[Blog] Admin API delete - document:", documentId);
  
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "X-Appwrite-Key": apiKey,
      "X-Appwrite-Project": projectId,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Blog] Admin API delete error - Status:", response.status, "Message:", errorText);
    
    // If it fails, try with regular client as fallback
    console.warn("[Blog] Admin API delete failed, falling back to regular client");
    try {
      return await databases.deleteDocument(databaseId, collectionId, documentId);
    } catch (fallbackError) {
      throw new Error(`Admin API: ${errorText}`);
    }
  }
  
  return true;
};

// Helper to update documents using admin API
const updateDocumentAdmin = async (databaseId: string, collectionId: string, documentId: string, data: any) => {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    console.warn("[Blog] Admin API not available, using regular client");
    return databases.updateDocument(databaseId, collectionId, documentId, data);
  }

  const url = `${endpoint}/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`;
  
  console.log("[Blog] Admin API update - document:", documentId);
  
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Key": apiKey,
      "X-Appwrite-Project": projectId,
    },
    body: JSON.stringify({ data }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Blog] Admin API error - Status:", response.status, "Message:", errorText);
    
    // If it fails, try with regular client as fallback
    console.warn("[Blog] Admin API failed, falling back to regular client");
    try {
      return await databases.updateDocument(databaseId, collectionId, documentId, data);
    } catch (fallbackError) {
      throw new Error(`Admin API: ${errorText}`);
    }
  }
  
  return response.json();
};

// Blog Interface
export interface Blog {
  $id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  status?: "draft" | "pending" | "approved" | "rejected";
  rejectionReason?: string;
  rejectionHistory?: Array<{ reason: string; rejectedAt: string; rejectedBy?: string }>;
  rejectionCount?: number;
  publishedAt?: string;
  views: number;
  likes: number;
  featured: boolean;
  readTime: number; // in minutes
  $createdAt?: string;
  $updatedAt?: string;
}

// Blog Service
export const blogService = {
  // Diagnostic helper to check if collection exists
  async checkBlogsCollection() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        [Query.limit(1)]
      );
      return true;
    } catch (error: any) {
      if (error?.message?.includes("Collection with the requested ID could not be found")) {
        console.error("❌ Blog collection not found! You need to create the 'blog' collection in your Appwrite database.");
        console.error("📋 Collection ID:", BLOGS_COLLECTION_ID);
        console.error("📝 Create it at: https://cloud.appwrite.io/console/databases");
      }
      return false;
    }
  },

  // Get all approved blogs (public)
  async getPublishedBlogs(limit: number = 50) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        [
          Query.equal("status", "approved"),
          Query.orderDesc("$updatedAt"),
          Query.limit(limit),
        ]
      );
      return response.documents as unknown as Blog[];
    } catch (error: any) {
      console.error("Error fetching published blogs:", error);
      // If the error is about publishedAt not existing, try again without it
      if (error?.message?.includes("publishedAt")) {
        try {
          const response = await databases.listDocuments(
            DATABASE_ID,
            BLOGS_COLLECTION_ID,
            [
              Query.equal("status", "approved"),
              Query.orderDesc("$updatedAt"),
              Query.limit(limit),
            ]
          );
          return response.documents as unknown as Blog[];
        } catch (retryError) {
          console.error("Error fetching published blogs (retry):", retryError);
        }
      }
      return [];
    }
  },

  // Get featured blogs
  async getFeaturedBlogs(limit: number = 3) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        [
          Query.equal("status", "approved"),
          Query.equal("featured", true),
          Query.orderDesc("$updatedAt"),
          Query.limit(limit),
        ]
      );
      return response.documents as unknown as Blog[];
    } catch (error: any) {
      console.error("Error fetching featured blogs:", error);
      // If the error is about publishedAt not existing, try again without it
      if (error?.message?.includes("publishedAt")) {
        try {
          const response = await databases.listDocuments(
            DATABASE_ID,
            BLOGS_COLLECTION_ID,
            [
              Query.equal("status", "approved"),
              Query.equal("featured", true),
              Query.orderDesc("$updatedAt"),
              Query.limit(limit),
            ]
          );
          return response.documents as unknown as Blog[];
        } catch (retryError) {
          console.error("Error fetching featured blogs (retry):", retryError);
        }
      }
      return [];
    }
  },

  // Get blogs by category
  async getBlogsByCategory(category: string, limit: number = 20) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        [
          Query.equal("status", "approved"),
          Query.equal("category", category),
          Query.orderDesc("publishedAt"),
          Query.limit(limit),
        ]
      );
      return response.documents as unknown as Blog[];
    } catch (error) {
      console.error("Error fetching blogs by category:", error);
      return [];
    }
  },

  // Get blog by slug (public - approved only)
  async getBlogBySlug(slug: string) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        [
          Query.equal("slug", slug),
          Query.equal("status", "approved"),
          Query.limit(1),
        ]
      );
      return response.documents[0] as unknown as Blog;
    } catch (error) {
      console.error("Error fetching blog by slug:", error);
      throw error;
    }
  },

  // Get blog by slug (any status - for admin or preview)
  async getBlogBySlugAny(slug: string) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        [
          Query.equal("slug", slug),
          Query.limit(1),
        ]
      );
      return response.documents[0] as unknown as Blog;
    } catch (error) {
      console.error("Error fetching blog by slug:", error);
      throw error;
    }
  },

  // Get user's blogs
  async getUserBlogs(userId: string) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        [
          Query.equal("userId", userId),
          Query.orderDesc("$createdAt"),
        ]
      );
      return response.documents as unknown as Blog[];
    } catch (error) {
      console.error("Error fetching user blogs:", error);
      return [];
    }
  },

  // Get all blogs (admin only)
  async getAllBlogs() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        [Query.orderDesc("$createdAt"), Query.limit(100)]
      );
      return response.documents as unknown as Blog[];
    } catch (error) {
      console.error("Error fetching all blogs:", error);
      return [];
    }
  },

  // Get pending blogs (admin only)
  async getPendingBlogs() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        [
          Query.equal("status", "pending"),
          Query.orderDesc("$createdAt"),
        ]
      );
      return response.documents as unknown as Blog[];
    } catch (error) {
      console.error("Error fetching pending blogs:", error);
      return [];
    }
  },

  // Create blog (user submission)
  async createBlog(blogData: Omit<Blog, "$id" | "$createdAt" | "$updatedAt">) {
    try {
      // Check if slug already exists
      const existingBlog = await databases.listDocuments(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        [Query.equal("slug", blogData.slug)]
      );
      
      if (existingBlog.documents.length > 0) {
        // Append timestamp to make slug unique
        const timestamp = Date.now();
        blogData.slug = `${blogData.slug}-${timestamp}`;
      }

      // Create document with permissions allowing the API key to update it
      // This allows admin operations to modify documents without permission issues
      const { ID: { unique }, Permission, Role } = await import("appwrite");
      
      const response = await databases.createDocument(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        unique(),
        {
          ...blogData,
          status: "pending", // Always starts as pending
          views: 0,
          likes: 0,
        },
        [
          // Allow the owner (creator) to read and write
          Permission.read(Role.user(blogData.authorId)),
          Permission.write(Role.user(blogData.authorId)),
          // Allow any authenticated user to read approved blogs
          Permission.read(Role.users()),
        ]
      );
      return response as unknown as Blog;
    } catch (error) {
      console.error("Error creating blog:", error);
      throw error;
    }
  },

  // Update blog
  async updateBlog(blogId: string, blogData: Partial<Blog>) {
    try {
      const response = await updateDocumentAdmin(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        blogId,
        blogData
      );
      return response as unknown as Blog;
    } catch (error) {
      console.error("Error updating blog:", error);
      throw error;
    }
  },

  // Approve blog (admin only)
  async approveBlog(blogId: string) {
    try {
      // First, try updating with publishedAt
      const updateData: Record<string, any> = {
        status: "approved",
        publishedAt: new Date().toISOString(),
      };

      try {
        const response = await updateDocumentAdmin(
          DATABASE_ID,
          BLOGS_COLLECTION_ID,
          blogId,
          updateData
        );
        return response as unknown as Blog;
      } catch (error: any) {
        // If publishedAt attribute doesn't exist, try without it
        if (error?.message?.includes("Attribute not found") || error?.message?.includes("publishedAt")) {
          console.warn("publishedAt attribute not found, updating without it");
          const response = await updateDocumentAdmin(
            DATABASE_ID,
            BLOGS_COLLECTION_ID,
            blogId,
            { status: "approved" }
          );
          return response as unknown as Blog;
        }
        throw error;
      }
    } catch (error: any) {
      console.error("Error approving blog:", error);
      throw error;
    }
  },

  // Reject blog (admin only)
  async rejectBlog(blogId: string, reason: string) {
    try {
      const blog = await this.getBlogById(blogId);
      
      // Keep track of rejection history
      let rejectionHistory: Array<any> = [];
      if (blog.rejectionHistory) {
        if (typeof blog.rejectionHistory === "string") {
          try {
            rejectionHistory = JSON.parse(blog.rejectionHistory);
          } catch {
            rejectionHistory = [];
          }
        } else if (Array.isArray(blog.rejectionHistory)) {
          rejectionHistory = blog.rejectionHistory;
        }
      }
      
      rejectionHistory.push({
        reason,
        rejectedAt: new Date().toISOString(),
      });

      // Try with all fields first
      const updateData: Record<string, any> = {
        status: "rejected",
        rejectionReason: reason,
        rejectionHistory: JSON.stringify(rejectionHistory),
        rejectionCount: (blog.rejectionCount || 0) + 1,
      };

      try {
        const response = await updateDocumentAdmin(
          DATABASE_ID,
          BLOGS_COLLECTION_ID,
          blogId,
          updateData
        );
        return response as unknown as Blog;
      } catch (error: any) {
        // If we get an attribute not found error, try minimal update with just status and reason
        if (error?.message?.includes("Attribute not found")) {
          console.warn("Some rejection attributes not found, updating with minimal fields:", error?.message);
          const response = await updateDocumentAdmin(
            DATABASE_ID,
            BLOGS_COLLECTION_ID,
            blogId,
            {
              status: "rejected",
              rejectionReason: reason,
            }
          );
          return response as unknown as Blog;
        }
        throw error;
      }
    } catch (error: any) {
      console.error("Error rejecting blog:", error);
      throw error;
    }
  },

  // Delete blog (verify user is author or admin)
  async deleteBlog(blogId: string, userId?: string) {
    try {
      // If userId is provided, verify user owns the blog before deletion
      if (userId) {
        const blog = await this.getBlogById(blogId);
        if (blog && blog.authorId !== userId) {
          throw new Error("Unauthorized: You can only delete your own blogs");
        }
      }
      
      await deleteDocumentAdmin(DATABASE_ID, BLOGS_COLLECTION_ID, blogId);
      return true;
    } catch (error) {
      console.error("Error deleting blog:", error);
      throw error;
    }
  },

  // Get blog by ID (helper for authorization checks)
  async getBlogById(blogId: string) {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        blogId
      );
      return response as unknown as Blog;
    } catch (error) {
      console.error("Error fetching blog by ID:", error);
      throw error;
    }
  },

  // Increment views (atomic operation)
  async incrementViews(blogId: string) {
    try {
      // Instead of reading and writing, use a direct update
      // This is safer for concurrent requests
      const blog = await this.getBlogById(blogId);
      await databases.updateDocument(DATABASE_ID, BLOGS_COLLECTION_ID, blogId, {
        views: (blog.views || 0) + 1,
      });
    } catch (error) {
      console.error("Error incrementing views:", error);
      // Silently fail - don't break page load for this
    }
  },

  // Upload blog image
  async uploadBlogImage(file: File) {
    try {
      // NOTE: Ensure storage bucket permissions allow authenticated users to upload
      // Go to Appwrite Console > Storage > blog-images bucket > Permissions
      // Set: role:authenticated (Create, Read) and role:any (Read)
      const response = await storage.createFile(
        BLOG_IMAGES_BUCKET_ID,
        ID.unique(),
        file
      );
      const fileUrl = storage.getFileView(BLOG_IMAGES_BUCKET_ID, response.$id);
      return fileUrl.toString();
    } catch (error) {
      console.error("Error uploading blog image:", error);
      // If you see "permission denied", check storage bucket permissions in Appwrite Console
      if (error instanceof Error && error.message.includes("permission")) {
        throw new Error(
          "Storage permission denied. Please check your bucket permissions at: " +
          "https://cloud.appwrite.io/console/storage"
        );
      }
      throw error;
    }
  },

  // Generate slug from title
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  },

  // Calculate read time (words per minute)
  calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  },

  // Toggle featured status with limit check
  async toggleFeatured(blogId: string, setFeatured: boolean) {
    try {
      // If trying to feature, check limit (max 5 featured blogs)
      if (setFeatured) {
        const featured = await databases.listDocuments(
          DATABASE_ID,
          BLOGS_COLLECTION_ID,
          [
            Query.equal("featured", true),
            Query.limit(100)
          ]
        );
        
        if (featured.documents.length >= 5) {
          throw new Error("Maximum 5 featured blogs allowed. Please unfeature one first.");
        }
      }

      const response = await updateDocumentAdmin(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        blogId,
        { featured: setFeatured }
      );
      return response as unknown as Blog;
    } catch (error) {
      console.error("Error toggling featured:", error);
      throw error;
    }
  },
};

// Blog Categories
export const blogCategories = [
  { value: "technology", label: "Technology" },
  { value: "ai-ml", label: "AI & Machine Learning" },
  { value: "web-dev", label: "Web Development" },
  { value: "mobile-dev", label: "Mobile Development" },
  { value: "data-science", label: "Data Science" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "design", label: "Design" },
  { value: "career", label: "Career & Growth" },
  { value: "tutorial", label: "Tutorial" },
  { value: "news", label: "News & Updates" },
  { value: "other", label: "Other" },
];