// app/api/coupons/route.ts
// Coupon management + validation + usage tracking
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, verifyAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { handleApiError, validateRequestBody, successResponse, ApiError } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schemas
const createCouponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(50, "Code too long"),
  description: z.string().max(500, "Description too long").optional(),
  type: z.enum(["percentage", "fixed"], { errorMap: () => ({ message: "Type must be 'percentage' or 'fixed'" }) }),
  value: z.number().positive("Value must be positive"),
  minPurchase: z.number().min(0).default(0),
  maxDiscount: z.number().positive().optional(),
  scope: z.enum(["global", "event"]).default("global"),
  eventId: z.string().optional(),
  eventName: z.string().optional(),
  usageLimit: z.number().int().min(0).default(0),
  perUserLimit: z.number().int().min(0).default(0),
  validFrom: z.string().datetime("Invalid date format for validFrom"),
  validUntil: z.string().datetime("Invalid date format for validUntil"),
  createdBy: z.string().optional(),
});

const applyCouponSchema = z.object({
  couponId: z.string().min(1, "Coupon ID is required"),
  couponCode: z.string().optional(),
  userId: z.string().min(1, "User ID is required"),
  userName: z.string().optional(),
  userEmail: z.string().email().optional(),
  eventId: z.string().min(1, "Event ID is required"),
  originalPrice: z.number().positive("Original price must be positive"),
  discountAmount: z.number().min(0).optional(),
  finalPrice: z.number().min(0).optional(),
});

const updateCouponSchema = z.object({
  couponId: z.string().min(1, "Coupon ID is required"),
  isActive: z.boolean().optional(),
  description: z.string().max(500).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  usageLimit: z.number().int().min(0).optional(),
  perUserLimit: z.number().int().min(0).optional(),
});

// GET /api/coupons — list all or validate a specific code
// ?code=EARLYBIRD50&eventId=xxx&userId=yyy — validate
// ?all=true — admin: list all coupons
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const eventId = request.nextUrl.searchParams.get("eventId");
    const userId = request.nextUrl.searchParams.get("userId");
    const listAll = request.nextUrl.searchParams.get("all");

    // Admin: list all coupons
    if (listAll === "true") {
      const { isAdmin } = await verifyAdminAuth(request);
      if (!isAdmin) {
        throw new ApiError(401, "Admin access required");
      }
      const result = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.COUPONS);
      return successResponse({ coupons: result.documents });
    }

    // Validate a coupon code
    if (!code) {
      throw new ApiError(400, "code parameter required");
    }

    // Find coupon by code
    const result = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.COUPONS, [
      Query.equal("code", code.toUpperCase()),
    ]);

    const coupon = result.documents[0];

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" });
    }

    // Check if active
    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, error: "This coupon is no longer active" });
    }

    // Check date validity
    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return NextResponse.json({ valid: false, error: "This coupon is not yet valid" });
    }
    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      return NextResponse.json({ valid: false, error: "This coupon has expired" });
    }

    // Check usage limit
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, error: "This coupon has reached its usage limit" });
    }

    // Check event scope
    if (coupon.scope === "event" && coupon.eventId && eventId && coupon.eventId !== eventId) {
      return NextResponse.json({ valid: false, error: "This coupon is not valid for this event" });
    }

    // Check per-user limit
    if (userId && coupon.perUserLimit > 0) {
      const usageResult = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.COUPON_USAGE, [
        Query.equal("couponId", coupon.$id),
        Query.equal("userId", userId),
      ]);
      if (usageResult.total >= coupon.perUserLimit) {
        return NextResponse.json({ valid: false, error: "You've already used this coupon" });
      }
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        $id: coupon.$id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
        minPurchase: coupon.minPurchase,
        description: coupon.description,
        scope: coupon.scope,
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/coupons");
  }
}

// POST /api/coupons
// action: "create" | "apply"
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Admin: create a new coupon
    if (action === "create") {
      const { isAdmin } = await verifyAdminAuth(request);
      if (!isAdmin) {
        throw new ApiError(401, "Admin access required");
      }

      const data = await validateRequestBody(request, createCouponSchema);

      // Check for duplicate code
      const existResult = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.COUPONS, [
        Query.equal("code", data.code.toUpperCase()),
      ]);
      if (existResult.total > 0) {
        throw new ApiError(409, "Coupon code already exists", "DUPLICATE_CODE");
      }

      const doc = await adminDb.createDocument(DATABASE_ID, COLLECTIONS.COUPONS, ID.unique(), {
        code: data.code.toUpperCase(),
        description: data.description || null,
        type: data.type,
        value: data.value,
        minPurchase: data.minPurchase,
        maxDiscount: data.maxDiscount || null,
        scope: data.scope,
        eventId: data.scope === "event" ? data.eventId : null,
        eventName: data.scope === "event" ? data.eventName : null,
        usageLimit: data.usageLimit,
        usedCount: 0,
        perUserLimit: data.perUserLimit,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        isActive: true,
        createdBy: data.createdBy || "",
      });

      return successResponse({ coupon: doc, message: "Coupon created successfully" }, 201);
    }

    // Apply a coupon (record usage + increment count)
    if (action === "apply") {
      const { authenticated } = await verifyAuth(request);
      if (!authenticated) {
        throw new ApiError(401, "Authentication required");
      }

      const data = await validateRequestBody(request, applyCouponSchema);

      // Record usage
      const usage = await adminDb.createDocument(DATABASE_ID, COLLECTIONS.COUPON_USAGE, ID.unique(), {
        couponId: data.couponId,
        couponCode: data.couponCode || "",
        userId: data.userId,
        userName: data.userName || "",
        userEmail: data.userEmail || "",
        eventId: data.eventId,
        originalPrice: data.originalPrice,
        discountAmount: data.discountAmount || 0,
        finalPrice: data.finalPrice || data.originalPrice,
        usedAt: new Date().toISOString(),
      });

      // Increment usedCount on coupon
      try {
        const couponData = await adminDb.getDocument(DATABASE_ID, COLLECTIONS.COUPONS, data.couponId);
        await adminDb.updateDocument(DATABASE_ID, COLLECTIONS.COUPONS, data.couponId, {
          usedCount: (couponData.usedCount || 0) + 1,
        });
      } catch {
        // Non-fatal: usage was already recorded
      }

      return successResponse({ usage, message: "Coupon applied successfully" }, 201);
    }

    throw new ApiError(400, "Invalid action. Must be 'create' or 'apply'");
  } catch (error) {
    return handleApiError(error, "POST /api/coupons");
  }
}

// PATCH /api/coupons — toggle active, update details
export async function PATCH(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(401, "Admin access required");
    }

    const data = await validateRequestBody(request, updateCouponSchema);
    const { couponId, ...updateData } = data;

    const doc = await adminDb.updateDocument(DATABASE_ID, COLLECTIONS.COUPONS, couponId, updateData);
    return successResponse({ coupon: doc, message: "Coupon updated successfully" });
  } catch (error) {
    return handleApiError(error, "PATCH /api/coupons");
  }
}

// DELETE /api/coupons — Delete coupon (admin)
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(401, "Admin access required");
    }

    const { couponId } = await request.json();

    if (!couponId) {
      throw new ApiError(400, "couponId required");
    }

    await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.COUPONS, couponId);
    return successResponse({ message: "Coupon deleted successfully" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/coupons");
  }
}
