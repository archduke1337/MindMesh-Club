// app/api/admin/club-members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { handleApiError, validateRequestBody, successResponse, ApiError } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schemas
const createClubMemberSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  designation: z.string().optional(),
  memberType: z.string().default("core"),
  department: z.string().optional(),
  bio: z.string().max(1000, "Bio too long").optional(),
  tagline: z.string().max(200, "Tagline too long").optional(),
  institution: z.string().optional(),
  linkedin: z.string().url("Invalid LinkedIn URL").optional(),
  github: z.string().url("Invalid GitHub URL").optional(),
  avatar: z.string().url("Invalid avatar URL").optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  displayOrder: z.number().int().min(0).default(0),
});

const updateClubMemberSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  name: z.string().min(1).max(100).optional(),
  designation: z.string().optional(),
  memberType: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().max(1000).optional(),
  tagline: z.string().max(200).optional(),
  institution: z.string().optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
  role: z.string().optional(),
  position: z.number().int().min(0).optional(),
});

// GET all club members
export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const { documents } = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TEAM,
      [Query.limit(100)]
    );
    return successResponse({ members: documents });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/club-members");
  }
}

// POST create a new club member
export async function POST(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const data = await validateRequestBody(request, createClubMemberSchema);

    const doc = await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.TEAM,
      ID.unique(),
      {
        name: data.name,
        role: data.designation || data.memberType || "Member",
        avatar: data.avatar || null,
        linkedin: data.linkedin || null,
        github: data.github || null,
        bio: data.bio || null,
        achievements: [],
        color: "primary",
        position: data.displayOrder,
        isActive: data.isActive,
        memberType: data.memberType,
        designation: data.designation || null,
        department: data.department || null,
        tagline: data.tagline || null,
        institution: data.institution || null,
        isFeatured: data.isFeatured,
        displayOrder: data.displayOrder,
      }
    );

    return successResponse({ member: doc, message: "Club member created successfully" }, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/admin/club-members");
  }
}

// PATCH update a club member
export async function PATCH(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const data = await validateRequestBody(request, updateClubMemberSchema);
    const { memberId, ...updateData } = data;

    // Map designation -> role if present
    if (updateData.designation && !updateData.role) {
      updateData.role = updateData.designation;
    }
    if (updateData.displayOrder !== undefined && updateData.position === undefined) {
      updateData.position = updateData.displayOrder;
    }

    // Clean undefined values
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && value !== "") {
        cleanData[key] = value;
      } else if (value === "") {
        cleanData[key] = null;
      }
    }

    const doc = await adminDb.updateDocument(
      DATABASE_ID,
      COLLECTIONS.TEAM,
      memberId,
      cleanData
    );

    return successResponse({ member: doc, message: "Club member updated successfully" });
  } catch (error) {
    return handleApiError(error, "PATCH /api/admin/club-members");
  }
}

// DELETE a club member
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const memberId = request.nextUrl.searchParams.get("id");
    if (!memberId) {
      throw new ApiError(400, "id parameter required");
    }

    await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.TEAM, memberId);

    return successResponse({ message: "Club member deleted successfully" });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/club-members");
  }
}
