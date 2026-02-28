/**
 * Database-backed rate limiter for blog submissions.
 * Counts recent blogs by the user in Appwrite instead of using
 * an in-memory Map (which resets on every serverless cold start).
 */
import { adminDb, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";

const BLOG_SUBMISSION_LIMIT = 5; // Max 5 blogs per day
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Count how many blogs _userId_ has created in the last 24 h.
 */
async function recentBlogCount(userId: string): Promise<number> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  try {
    const result = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.BLOG, [
      Query.equal("authorId", userId),
      Query.greaterThanEqual("$createdAt", since),
      Query.limit(1), // we only need total
    ]);
    return result.total;
  } catch {
    // Fail-closed: if the query fails, treat as limit exceeded to prevent abuse
    console.warn("[RateLimiter] Failed to query blog count, denying submission");
    return BLOG_SUBMISSION_LIMIT;
  }
}

/**
 * Check if user has exceeded blog submission limit.
 * @returns true if user is within limit, false if they've exceeded it
 */
export const checkBlogRateLimit = async (userId: string): Promise<boolean> => {
  const count = await recentBlogCount(userId);
  return count < BLOG_SUBMISSION_LIMIT;
};

/**
 * Get remaining submissions for user.
 */
export const getRemainingSubmissions = async (userId: string): Promise<number> => {
  const count = await recentBlogCount(userId);
  return Math.max(0, BLOG_SUBMISSION_LIMIT - count);
};

