// app/api/members/profile/route.ts
// Server-side API for member profile create/update
import { NextRequest, NextResponse } from "next/server";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = "member_profiles";

function getAdminHeaders() {
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
  const apiKey = process.env.APPWRITE_API_KEY!;
  return {
    "Content-Type": "application/json",
    "X-Appwrite-Project": projectId,
    "X-Appwrite-Key": apiKey,
  };
}

function getEndpoint() {
  return process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
}

// GET /api/members/profile?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const endpoint = getEndpoint();
    const res = await fetch(
      `${endpoint}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?queries[]=${encodeURIComponent(
        JSON.stringify({ method: "equal", attribute: "userId", values: [userId] })
      )}`,
      {
        headers: getAdminHeaders(),
        cache: "no-store",
      }
    );

    // Use Appwrite REST query format
    const queryRes = await fetch(
      `${endpoint}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
      {
        method: "GET",
        headers: {
          ...getAdminHeaders(),
        },
        cache: "no-store",
      }
    );

    if (!queryRes.ok) {
      const err = await queryRes.text();
      console.error("[API] List profiles error:", err);
      return NextResponse.json({ profile: null });
    }

    const data = await queryRes.json();
    const profile = data.documents?.find(
      (doc: any) => doc.userId === userId
    );

    return NextResponse.json({ profile: profile || null });
  } catch (error: any) {
    console.error("[API] Profile GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get profile" },
      { status: 500 }
    );
  }
}

// POST /api/members/profile — Create profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      email,
      phone,
      whatsapp,
      branch,
      year,
      college,
      program,
      rollNumber,
      skills,
      interests,
      bio,
      linkedin,
      github,
      twitter,
      portfolio,
    } = body;

    // Validate required fields
    if (!userId || !name || !email || !phone || !whatsapp || !branch || !year || !college || !program) {
      return NextResponse.json(
        { error: "Missing required fields: userId, name, email, phone, whatsapp, branch, year, college, program" },
        { status: 400 }
      );
    }

    const endpoint = getEndpoint();

    // Create profile document
    const profileData = {
      userId,
      name,
      email,
      phone,
      whatsapp,
      branch,
      year,
      college,
      program,
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
    };

    const createRes = await fetch(
      `${endpoint}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
      {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          documentId: "unique()",
          data: profileData,
        }),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("[API] Create profile error:", errText);
      
      // Check for duplicate
      if (createRes.status === 409) {
        return NextResponse.json(
          { error: "Profile already exists for this user" },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to create profile: ${errText}` },
        { status: createRes.status }
      );
    }

    const profile = await createRes.json();

    // Update Appwrite account prefs to mark profile as completed
    try {
      // We use a separate call to update user prefs via server SDK
      const prefsRes = await fetch(
        `${endpoint}/users/${userId}/prefs`,
        {
          method: "PATCH",
          headers: getAdminHeaders(),
          body: JSON.stringify({ profileCompleted: true }),
        }
      );
      if (!prefsRes.ok) {
        console.warn("[API] Could not update user prefs:", await prefsRes.text());
      }
    } catch (prefsErr) {
      console.warn("[API] Prefs update failed (non-critical):", prefsErr);
    }

    return NextResponse.json(
      { success: true, profile },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API] Profile POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create profile" },
      { status: 500 }
    );
  }
}

// PATCH /api/members/profile — Update profile
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, ...updateData } = body;

    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    const endpoint = getEndpoint();

    const updateRes = await fetch(
      `${endpoint}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${profileId}`,
      {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ data: updateData }),
      }
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error("[API] Update profile error:", errText);
      return NextResponse.json(
        { error: `Failed to update profile: ${errText}` },
        { status: updateRes.status }
      );
    }

    const profile = await updateRes.json();
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("[API] Profile PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
