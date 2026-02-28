// app/api/admin/club-members/route.ts
import { NextRequest, NextResponse } from "next/server";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = "club_members";

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

// GET all club members
export async function GET() {
  try {
    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?queries[]=${encodeURIComponent('{"method":"limit","values":[100]}')}`
    );
    if (!res.ok) {
      return NextResponse.json({ members: [] });
    }
    const data = await res.json();
    return NextResponse.json({ members: data.documents || [] });
  } catch {
    return NextResponse.json({ members: [] });
  }
}

// POST create a new club member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, designation, memberType, department, bio,
      tagline, institution, linkedin, github, isActive,
      isFeatured, displayOrder,
    } = body;

    if (!name || !designation) {
      return NextResponse.json({ error: "Name and designation are required" }, { status: 400 });
    }

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
      {
        method: "POST",
        body: JSON.stringify({
          documentId: "unique()",
          data: {
            name,
            designation,
            memberType: memberType || "core",
            department: department || null,
            bio: bio || null,
            tagline: tagline || null,
            institution: institution || null,
            linkedin: linkedin || null,
            github: github || null,
            isActive: isActive !== undefined ? isActive : true,
            isFeatured: isFeatured || false,
            displayOrder: displayOrder || 0,
            color: "primary",
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const doc = await res.json();
    return NextResponse.json({ member: doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update a club member
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, ...updateData } = body;

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    // Clean undefined values
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && value !== "") {
        cleanData[key] = value;
      } else if (value === "") {
        cleanData[key] = null;
      }
    }

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${memberId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ data: cleanData }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const doc = await res.json();
    return NextResponse.json({ member: doc });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
