// app/api/members/profile/route.ts
// Server-side API for member profile create/read/update
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { adminDb, adminUsers, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { memberProfileSchema } from "@/lib/validation/schemas";
import { handleApiError, ApiError, successResponse, validateRequestBody } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Update schema for PATCH
const updateProfileSchema = z.object({
  profileId: z.string().min(1, "Profile ID is required"),
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(5).optional(),
  whatsapp: z.string().min(5).optional(),
  branch: z.string().min(1).optional(),
  year: z.string().min(1).optional(),
  college: z.string().min(1).optional(),
  program: z.string().min(1).optional(),
  rollNumber: z.string().optional().nullable(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  bio: z.string().max(1000).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  linkedin: z.string().url().optional().nullable(),
  github: z.string().url().optional().nullable(),
  twitter: z.string().url().optional().nullable(),
  portfolio: z.string().url().optional().nullable(),
});

// GET /api/members/profile?userId=xxx
export async function GET(request: NextRequest) {
  try {
    let userId = request.nextUrl.searchParams.get("userId");

    // If userId is __SELF__, we can't resolve server-side without auth cookies
    if (!userId || userId === "__SELF__") {
      return successResponse({ profile: null });
    }

    const { documents } = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MEMBER_PROFILES,
      [Query.equal("userId", userId), Query.limit(1)]
    );

    return successResponse({ profile: documents[0] || null });
  } catch (error: unknown) {
    return handleApiError(error, "GET /api/members/profile");
  }
}

// POST /api/members/profile — Create profile
export async function POST(request: NextRequest) {
  const { authenticated, user: authUser } = await verifyAuth(request);
  if (!authenticated || !authUser) {
    throw new ApiError(401, "Authentication required");
  }

  try {
    const validated = await validateRequestBody(request, memberProfileSchema);

    // Use server-verified userId
    const userId = authUser.$id;

    // Check for existing profile
    const { documents: existing } = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MEMBER_PROFILES,
      [Query.equal("userId", userId), Query.limit(1)]
    );

    if (existing.length > 0) {
      // Update instead of duplicate
      const profile = await adminDb.updateDocument(
        DATABASE_ID,
        COLLECTIONS.MEMBER_PROFILES,
        existing[0].$id,
        {
          name: validated.name,
          email: validated.email,
          phone: validated.phone,
          whatsapp: validated.whatsapp,
          branch: validated.branch,
          year: validated.year,
          college: validated.college,
          program: validated.program,
          rollNumber: validated.rollNumber || null,
          skills: validated.skills || [],
          interests: validated.interests || [],
          bio: validated.bio || null,
          linkedin: validated.linkedin || null,
          github: validated.github || null,
          twitter: validated.twitter || null,
          portfolio: validated.portfolio || null,
        }
      );
      return successResponse({ profile });
    }

    // Create new profile
    const profile = await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.MEMBER_PROFILES,
      ID.unique(),
      {
        userId,
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        whatsapp: validated.whatsapp,
        branch: validated.branch,
        year: validated.year,
        college: validated.college,
        program: validated.program,
        rollNumber: validated.rollNumber || null,
        skills: validated.skills || [],
        interests: validated.interests || [],
        bio: validated.bio || null,
        avatar: null,
        linkedin: validated.linkedin || null,
        github: validated.github || null,
        twitter: validated.twitter || null,
        portfolio: validated.portfolio || null,
        memberStatus: "pending",
        eventsAttended: 0,
        badges: [],
      }
    );

    // Update user prefs to mark profile as completed
    try {
      await adminUsers.updatePrefs(userId, { profileCompleted: true });
    } catch {
      // Non-critical
    }

    return successResponse({ profile }, 201);
  } catch (error: unknown) {
    return handleApiError(error, "POST /api/members/profile");
  }
}

// PATCH /api/members/profile — Update profile
export async function PATCH(request: NextRequest) {
  const { authenticated, user: authUser } = await verifyAuth(request);
  if (!authenticated || !authUser) {
    throw new ApiError(401, "Authentication required");
  }
  
  try {
    const body = await validateRequestBody(request, updateProfileSchema);
    const { profileId, ...updateData } = body;

    const profile = await adminDb.updateDocument(
      DATABASE_ID,
      COLLECTIONS.MEMBER_PROFILES,
      profileId,
      updateData
    );

    return successResponse({ profile });
  } catch (error: unknown) {
    return handleApiError(error, "PATCH /api/members/profile");
  }
}
