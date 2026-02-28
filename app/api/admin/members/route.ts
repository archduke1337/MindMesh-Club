// app/api/admin/members/route.ts
// Admin API to list all member profiles and update memberStatus
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = "member_profiles";

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

export async function GET(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const res = await fetch(
      `${getEndpoint()}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?queries[]=${encodeURIComponent('{"method":"limit","values":[500]}')}`,
      {
        headers: getHeaders(),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("[API] List members error:", errText);
      return NextResponse.json({ profiles: [] });
    }

    const data = await res.json();
    return NextResponse.json({ profiles: data.documents || [] });
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

    const res = await fetch(
      `${getEndpoint()}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${profileId}`,
      {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ data: { memberStatus } }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const profile = await res.json();
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("[API] Admin members PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
