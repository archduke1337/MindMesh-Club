// app/api/admin/club-members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { getErrorMessage } from "@/lib/errorHandler";

// GET all club members
export async function GET(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const { documents } = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TEAM,
      [Query.limit(100)]
    );
    return NextResponse.json({ members: documents });
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

    const doc = await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.TEAM,
      ID.unique(),
      {
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
      }
    );

    return NextResponse.json({ member: doc }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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

    return NextResponse.json({ member: doc });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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

    await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.TEAM, memberId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
