// app/api/admin/club-members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = "team"; // The Appwrite collection for club/team members

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
export async function GET(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
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
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const {
      name, designation, memberType, department, bio,
      tagline, institution, linkedin, github, avatar,
      isActive, isFeatured, displayOrder,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
      {
        method: "POST",
        body: JSON.stringify({
          documentId: "unique()",
          data: {
            name,
            role: designation || memberType || "Member",
            avatar: avatar || null,
            linkedin: linkedin || null,
            github: github || null,
            bio: bio || null,
            achievements: [],
            color: "primary",
            position: displayOrder || 0,
            isActive: isActive !== undefined ? isActive : true,
            memberType: memberType || "core",
            designation: designation || null,
            department: department || null,
            tagline: tagline || null,
            institution: institution || null,
            isFeatured: isFeatured || false,
            displayOrder: displayOrder || 0,
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
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { memberId, ...updateData } = body;

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    // Map designation -> role if present
    if (updateData.designation && !updateData.role) {
      updateData.role = updateData.designation;
    }
    if (updateData.displayOrder !== undefined && updateData.position === undefined) {
      updateData.position = updateData.displayOrder;
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

// DELETE a club member
export async function DELETE(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const memberId = request.nextUrl.searchParams.get("id");
    if (!memberId) {
      return NextResponse.json({ error: "id parameter required" }, { status: 400 });
    }

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${memberId}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
