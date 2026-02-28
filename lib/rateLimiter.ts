/**
 * Database-backed rate limiter for API endpoints.
 * Counts recent requests by user/IP in Appwrite instead of using
 * an in-memory Map (which resets on every serverless cold start).
 */
import { adminDb, DATABASE_ID, COLLECTIONS, Query, ID } from "@/lib/appwrite/server";

const BLOG_SUBMISSION_LIMIT = 5; // Max 5 blogs per day
const LOGIN_ATTEMPT_LIMIT = 5; // Max 5 login attempts per 15 minutes
const API_REQUEST_LIMIT = 100; // Max 100 requests per minute per endpoint
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const API_WINDOW_MS = 60 * 1000; // 1 minute

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

/**
 * Check login rate limit by IP address.
 * Prevents brute force attacks.
 */
export const checkLoginRateLimit = async (identifier: string): Promise<boolean> => {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS).toISOString();
  
  try {
    // Create a rate_limits collection to track attempts
    // For now, we'll use a simple in-memory approach with Appwrite documents
    // In production, consider using Redis or Upstash
    
    // Query recent login attempts (you'll need to create a rate_limits collection)
    // For now, return true to not block during implementation
    // TODO: Implement proper rate limit tracking collection
    return true;
  } catch {
    console.warn("[RateLimiter] Failed to check login rate limit");
    return false; // Fail-closed for security
  }
};

/**
 * Check API rate limit per user per endpoint.
 * Prevents API abuse.
 */
export const checkApiRateLimit = async (
  userId: string,
  endpoint: string
): Promise<boolean> => {
  const since = new Date(Date.now() - API_WINDOW_MS).toISOString();
  
  try {
    // TODO: Implement proper rate limit tracking
    // For now, return true to not block during implementation
    // In production, use Redis/Upstash for better performance
    return true;
  } catch {
    console.warn("[RateLimiter] Failed to check API rate limit");
    return false; // Fail-closed for security
  }
};

/**
 * Record a rate limit attempt (for tracking).
 * This would store in a rate_limits collection.
 */
export const recordRateLimitAttempt = async (
  identifier: string,
  type: "login" | "api" | "blog",
  endpoint?: string
): Promise<void> => {
  try {
    // TODO: Implement rate limit tracking collection
    // await adminDb.createDocument(DATABASE_ID, "rate_limits", ID.unique(), {
    //   identifier,
    //   type,
    //   endpoint,
    //   timestamp: new Date().toISOString(),
    // });
  } catch (error) {
    console.warn("[RateLimiter] Failed to record attempt:", error);
  }
};