// app/api/admin/members/route.ts
// Admin API to list all member profiles and update memberStatus
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";

export async function GET(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const { documents } = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MEMBER_PROFILES,
      [Query.limit(500)]
    );
    return NextResponse.json({ profiles: documents });
  } catch (error: any) {
    console.error("[API] Admin members error:", error);
    return NextResponse.json({ profiles: [] });
  }
}

// PATCH /api/admin/members — Update memberStatus (admin only)
export async function PATCH(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { profileId, memberStatus } = body;

    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    if (!memberStatus || !["pending", "approved", "suspended"].includes(memberStatus)) {
      return NextResponse.json({ error: "Invalid memberStatus. Must be: pending, approved, or suspended" }, { status: 400 });
    }

    const profile = await adminDb.updateDocument(
      DATABASE_ID,
      COLLECTIONS.MEMBER_PROFILES,
      profileId,
      { memberStatus }
    );

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("[API] Admin members PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
