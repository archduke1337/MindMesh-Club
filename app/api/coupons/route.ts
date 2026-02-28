// app/api/coupons/route.ts
// Coupon management + validation + usage tracking
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, verifyAuth } from "@/lib/apiAuth";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
    "X-Appwrite-Key": process.env.APPWRITE_API_KEY!,
  };
}

function getEndpoint() {
  return process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
}

async function adminFetch(path: string, options: RequestInit = {}) {
  return fetch(`${getEndpoint()}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers as Record<string, string> || {}) },
  });
}

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
        return NextResponse.json({ error: "Admin access required" }, { status: 401 });
      }
      const res = await adminFetch(
        `/databases/${DATABASE_ID}/collections/coupons/documents`
      );
      if (!res.ok) return NextResponse.json({ coupons: [] });
      const data = await res.json();
      return NextResponse.json({ coupons: data.documents || [] });
    }

    // Validate a coupon code
    if (!code) {
      return NextResponse.json({ error: "code parameter required" }, { status: 400 });
    }

    // Find coupon by code
    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/coupons/documents`
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
    }

    const data = await res.json();
    const coupon = (data.documents || []).find(
      (c: any) => c.code.toUpperCase() === code.toUpperCase()
    );

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
      const usageRes = await adminFetch(
        `/databases/${DATABASE_ID}/collections/coupon_usage/documents`
      );
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        const userUses = (usageData.documents || []).filter(
          (u: any) => u.couponId === coupon.$id && u.userId === userId
        ).length;
        if (userUses >= coupon.perUserLimit) {
          return NextResponse.json({ valid: false, error: "You've already used this coupon" });
        }
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
        return NextResponse.json({ error: "Admin access required" }, { status: 401 });
      }
      const {
        code, description, type, value, minPurchase, maxDiscount,
        scope, eventId, eventName, usageLimit, perUserLimit,
        validFrom, validUntil, createdBy,
      } = body;

      if (!code || !type || value == null || !validFrom || !validUntil) {
        return NextResponse.json({
          error: "code, type, value, validFrom, validUntil required",
        }, { status: 400 });
      }

      // Check for duplicate code
      const existRes = await adminFetch(
        `/databases/${DATABASE_ID}/collections/coupons/documents`
      );
      if (existRes.ok) {
        const existData = await existRes.json();
        const dup = (existData.documents || []).find(
          (c: any) => c.code.toUpperCase() === code.toUpperCase()
        );
        if (dup) {
          return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
        }
      }

      const res = await adminFetch(
        `/databases/${DATABASE_ID}/collections/coupons/documents`,
        {
          method: "POST",
          body: JSON.stringify({
            documentId: "unique()",
            data: {
              code: code.toUpperCase(),
              description: description || null,
              type,
              value,
              minPurchase: minPurchase || 0,
              maxDiscount: maxDiscount || null,
              scope: scope || "global",
              eventId: scope === "event" ? eventId : null,
              eventName: scope === "event" ? eventName : null,
              usageLimit: usageLimit || 0,
              usedCount: 0,
              perUserLimit: perUserLimit || 0,
              validFrom,
              validUntil,
              isActive: true,
              createdBy: createdBy || "",
            },
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }

      const doc = await res.json();
      return NextResponse.json({ coupon: doc }, { status: 201 });
    }

    // Apply a coupon (record usage + increment count)
    if (action === "apply") {
      const { authenticated } = await verifyAuth(request);
      if (!authenticated) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      const {
        couponId, couponCode, userId, userName, userEmail,
        eventId, originalPrice, discountAmount, finalPrice,
      } = body;

      if (!couponId || !userId || !eventId || originalPrice == null) {
        return NextResponse.json({
          error: "couponId, userId, eventId, originalPrice required",
        }, { status: 400 });
      }

      // Record usage
      const usageRes = await adminFetch(
        `/databases/${DATABASE_ID}/collections/coupon_usage/documents`,
        {
          method: "POST",
          body: JSON.stringify({
            documentId: "unique()",
            data: {
              couponId,
              couponCode: couponCode || "",
              userId,
              userName: userName || "",
              userEmail: userEmail || "",
              eventId,
              originalPrice,
              discountAmount: discountAmount || 0,
              finalPrice: finalPrice || originalPrice,
              usedAt: new Date().toISOString(),
            },
          }),
        }
      );

      if (!usageRes.ok) {
        const err = await usageRes.text();
        return NextResponse.json({ error: err }, { status: usageRes.status });
      }

      // Increment usedCount on coupon
      const couponRes = await adminFetch(
        `/databases/${DATABASE_ID}/collections/coupons/documents/${couponId}`
      );
      if (couponRes.ok) {
        const couponData = await couponRes.json();
        await adminFetch(
          `/databases/${DATABASE_ID}/collections/coupons/documents/${couponId}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              data: { usedCount: (couponData.usedCount || 0) + 1 },
            }),
          }
        );
      }

      const usage = await usageRes.json();
      return NextResponse.json({ success: true, usage }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/coupons — toggle active, update details
export async function PATCH(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Admin access required" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { couponId, ...updateData } = body;

    if (!couponId) {
      return NextResponse.json({ error: "couponId required" }, { status: 400 });
    }

    // Whitelist allowed fields to prevent abuse (e.g., resetting usedCount)
    const allowedFields = ["isActive", "description", "validFrom", "validUntil", "usageLimit", "perUserLimit"];
    const safeData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in updateData) safeData[key] = updateData[key];
    }

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/coupons/documents/${couponId}`,
      { method: "PATCH", body: JSON.stringify({ data: safeData }) }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const doc = await res.json();
    return NextResponse.json({ coupon: doc });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
