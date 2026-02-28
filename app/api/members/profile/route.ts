// app/api/members/profile/route.ts
// Server-side API for member profile create/read/update
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { adminDb, adminUsers, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";

// GET /api/members/profile?userId=xxx
export async function GET(request: NextRequest) {
  try {
    let userId = request.nextUrl.searchParams.get("userId");

    // If userId is __SELF__, we can't resolve server-side without auth cookies
    // Just return null profile — the AuthContext will use actual userId
    if (!userId || userId === "__SELF__") {
      return NextResponse.json({ profile: null });
    }

    const { documents } = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MEMBER_PROFILES,
      [Query.equal("userId", userId), Query.limit(1)]
    );

    return NextResponse.json({ profile: documents[0] || null });
  } catch (error: any) {
    console.error("[API] Profile GET error:", error);
    return NextResponse.json({ profile: null });
  }
}

// POST /api/members/profile — Create profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId, name, email, phone, whatsapp, branch, year,
      college, program, rollNumber, skills, interests,
      bio, linkedin, github, twitter, portfolio,
    } = body;

    // Validate required fields
    if (!userId || !name || !email || !phone || !whatsapp || !branch || !year || !college || !program) {
      return NextResponse.json(
        { error: "Missing required fields: userId, name, email, phone, whatsapp, branch, year, college, program" },
        { status: 400 }
      );
    }

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
          name, email, phone, whatsapp, branch, year, college, program,
          rollNumber: rollNumber || null,
          skills: skills || [],
          interests: interests || [],
          bio: bio || null,
          linkedin: linkedin || null,
          github: github || null,
          twitter: twitter || null,
          portfolio: portfolio || null,
        }
      );
      return NextResponse.json({ success: true, profile });
    }

    // Create new profile
    const profile = await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.MEMBER_PROFILES,
      ID.unique(),
      {
        userId, name, email, phone, whatsapp, branch, year, college, program,
        rollNumber: rollNumber || null,
        skills: skills || [],
        interests: interests || [],
        bio: bio || null,
        avatar: null,
        linkedin: linkedin || null,
        github: github || null,
        twitter: twitter || null,
        portfolio: portfolio || null,
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

    return NextResponse.json({ success: true, profile }, { status: 201 });
  } catch (error: any) {
    console.error("[API] Profile POST error:", error);
    if (error.code === 409) {
      return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/members/profile — Update profile
export async function PATCH(request: NextRequest) {
  const { authenticated, user: authUser } = await verifyAuth(request);
  if (!authenticated || !authUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { profileId, ...updateData } = body;

    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    // Whitelist safe fields — prevent users from updating memberStatus, eventsAttended, badges
    const allowedFields = [
      "name", "email", "phone", "whatsapp", "branch", "year", "college", "program",
      "rollNumber", "skills", "interests", "bio", "avatar",
      "linkedin", "github", "twitter", "portfolio",
    ];
    const safeData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in updateData) safeData[key] = updateData[key];
    }

    const profile = await adminDb.updateDocument(
      DATABASE_ID,
      COLLECTIONS.MEMBER_PROFILES,
      profileId,
      safeData
    );

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("[API] Profile PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: error.code || 500 });
  }
}
