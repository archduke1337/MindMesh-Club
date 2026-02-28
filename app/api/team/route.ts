// app/api/team/route.ts
// Public API to get active club/team members (no auth required)
import { NextResponse } from "next/server";
import { adminFetch } from "@/lib/adminApi";
import { DATABASE_ID, COLLECTION_IDS } from "@/lib/types/appwrite";

const COLLECTION_ID = COLLECTION_IDS.TEAM;

export async function GET() {
  try {
    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?queries[]=${encodeURIComponent('{"method":"limit","values":[100]}')}`,
      { cache: "no-store" }
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
