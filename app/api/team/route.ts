// app/api/team/route.ts
// Public API to get active club/team members (no auth required)
import { NextResponse } from "next/server";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = "team";

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

export async function GET() {
  try {
    const res = await fetch(
      `${getEndpoint()}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?queries[]=${encodeURIComponent('{"method":"limit","values":[100]}')}`,
      {
        headers: getHeaders(),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ members: [] });
    }

    const data = await res.json();
    const documents = data.documents || [];

    // Only return active members, strip any sensitive fields
    const activeMembers = documents
      .filter((m: any) => m.isActive !== false)
      .sort((a: any, b: any) => (a.displayOrder || a.position || 0) - (b.displayOrder || b.position || 0))
      .map((m: any) => ({
        $id: m.$id,
        name: m.name,
        role: m.role || m.designation || "Member",
        designation: m.designation || m.role || "Member",
        avatar: m.avatar || null,
        linkedin: m.linkedin || null,
        github: m.github || null,
        bio: m.bio || null,
        memberType: m.memberType || "core",
        department: m.department || null,
        tagline: m.tagline || null,
        isFeatured: m.isFeatured || false,
        achievements: m.achievements || [],
        color: m.color || "primary",
      }));

    return NextResponse.json({ members: activeMembers });
  } catch (error: any) {
    console.error("[API] Public team GET error:", error);
    return NextResponse.json({ members: [] });
  }
}
