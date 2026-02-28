// app/api/members/profile/route.ts
// Server-side API for member profile create/read/update
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = "member_profiles";

function getAdminHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
    "X-Appwrite-Key": process.env.APPWRITE_API_KEY!,
  };
}

function getEndpoint() {
  return process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
}

// GET /api/members/profile?userId=xxx
export async function GET(request: NextRequest) {
  try {
    let userId = request.nextUrl.searchParams.get("userId");

    // If userId is __SELF__, we can't resolve server-side without auth cookies
    // Just return null profile — the AuthContext will use actual userId
    if (!userId || userId === "__SELF__") {
      return NextResponse.json({ profile: null });
    }

    const endpoint = getEndpoint();

    // Fetch all profiles and filter (Appwrite REST query syntax can be finicky)
    const res = await fetch(
      `${endpoint}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
      {
        headers: getAdminHeaders(),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ profile: null });
    }

    const data = await res.json();
    const profile = data.documents?.find(
      (doc: any) => doc.userId === userId
    );

    return NextResponse.json({ profile: profile || null });
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

    const endpoint = getEndpoint();

    // Check for existing profile
    const existRes = await fetch(
      `${endpoint}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
      { headers: getAdminHeaders(), cache: "no-store" }
    );
    if (existRes.ok) {
      const existData = await existRes.json();
      const existing = existData.documents?.find((d: any) => d.userId === userId);
      if (existing) {
        // Update instead of duplicate
        const updateRes = await fetch(
          `${endpoint}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${existing.$id}`,
          {
            method: "PATCH",
            headers: getAdminHeaders(),
            body: JSON.stringify({
              data: {
                name, email, phone, whatsapp, branch, year, college, program,
                rollNumber: rollNumber || null,
                skills: skills || [],
                interests: interests || [],
                bio: bio || null,
                linkedin: linkedin || null,
                github: github || null,
                twitter: twitter || null,
                portfolio: portfolio || null,
              },
            }),
          }
        );
        if (updateRes.ok) {
          const profile = await updateRes.json();
          return NextResponse.json({ success: true, profile });
        }
      }
    }

    // Create new profile
    const profileData = {
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
    };

    const createRes = await fetch(
      `${endpoint}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
      {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ documentId: "unique()", data: profileData }),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      if (createRes.status === 409) {
        return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: errText }, { status: createRes.status });
    }

    const profile = await createRes.json();

    // Update user prefs to mark profile as completed
    try {
      await fetch(`${endpoint}/users/${userId}/prefs`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ profileCompleted: true }),
      });
    } catch {
      // Non-critical
    }

    return NextResponse.json({ success: true, profile }, { status: 201 });
  } catch (error: any) {
    console.error("[API] Profile POST error:", error);
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

    const endpoint = getEndpoint();
    const updateRes = await fetch(
      `${endpoint}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${profileId}`,
      {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ data: safeData }),
      }
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return NextResponse.json({ error: errText }, { status: updateRes.status });
    }

    const profile = await updateRes.json();
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("[API] Profile PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
