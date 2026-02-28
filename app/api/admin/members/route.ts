// app/api/admin/members/route.ts
// Admin API to list all member profiles and update memberStatus
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";
import { handleApiError, validateRequestBody, successResponse, ApiError } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schema
const updateMemberStatusSchema = z.object({
  profileId: z.string().min(1, "Profile ID is required"),
  memberStatus: z.enum(["pending", "approved", "suspended"], {
    errorMap: () => ({ message: "Invalid memberStatus. Must be: pending, approved, or suspended" })
  }),
});

export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const { documents } = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MEMBER_PROFILES,
      [Query.limit(500)]
    );
    return successResponse({ profiles: documents });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/members");
  }
}

// PATCH /api/admin/members — Update memberStatus (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const data = await validateRequestBody(request, updateMemberStatusSchema);

    const profile = await adminDb.updateDocument(
      DATABASE_ID,
      COLLECTIONS.MEMBER_PROFILES,
      data.profileId,
      { memberStatus: data.memberStatus }
    );

    return successResponse({ profile, message: "Member status updated successfully" });
  } catch (error) {
    return handleApiError(error, "PATCH /api/admin/members");
  }
}
