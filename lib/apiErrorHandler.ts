// lib/apiErrorHandler.ts
/**
 * Centralized API error handling for consistent error responses
 * and security (prevents internal error exposure in production).
 */
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "./logger";
import { getErrorMessage } from "./errorHandler";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Handle API errors with consistent formatting and security
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  // Log error with context
  logger.error(`[API Error] ${context}:`, error);
  
  // TODO: Send to monitoring service (Sentry, etc.)
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, { tags: { context } });
  // }
  
  // Handle custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      { 
        success: false,
        error: error.message, 
        code: error.code,
        ...(process.env.NODE_ENV === "development" && error.details ? { details: error.details } : {})
      },
      { status: error.statusCode }
    );
  }
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      { 
        success: false,
        error: "Validation failed", 
        details: error.errors.map(e => ({
          field: e.path.join("."),
          message: e.message
        }))
      },
      { status: 400 }
    );
  }
  
  // Handle Appwrite errors
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    const appwriteError = error as { code: number; message: string; type?: string };
    
    // Map Appwrite error codes to HTTP status codes
    const statusCode = appwriteError.code || 500;
    
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === "development"
      ? appwriteError.message
      : getPublicErrorMessage(statusCode);
    
    return NextResponse.json(
      { 
        success: false,
        error: message,
        ...(process.env.NODE_ENV === "development" && appwriteError.type ? { type: appwriteError.type } : {})
      },
      { status: statusCode }
    );
  }
  
  // Generic error - never expose internal details in production
  const message = process.env.NODE_ENV === "development"
    ? getErrorMessage(error)
    : "An unexpected error occurred. Please try again later.";
    
  return NextResponse.json(
    { success: false, error: message },
    { status: 500 }
  );
}

/**
 * Get user-friendly error message based on status code
 */
function getPublicErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "Invalid request. Please check your input.";
    case 401:
      return "Authentication required. Please log in.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "A conflict occurred. The resource may already exist.";
    case 429:
      return "Too many requests. Please try again later.";
    case 500:
    case 502:
    case 503:
      return "Server error. Please try again later.";
    default:
      return "An error occurred. Please try again.";
  }
}

/**
 * Validate request body with Zod schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error; // Will be caught by handleApiError
    }
    throw new ApiError(400, "Invalid JSON in request body");
  }
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  });
}
