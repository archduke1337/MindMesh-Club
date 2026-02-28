// app/api/team/route.ts
// Public API to get active club/team members (no auth required)
import { NextResponse } from "next/server";
import { adminDb, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";
import { getErrorMessage } from "@/lib/errorHandler";

export async function GET() {
  try {
    const data = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TEAM,
      [Query.limit(100)]
    );
    const documents = data.documents || [];

    // Only return active members, strip any sensitive fields
    const activeMembers = documents
      .filter((m: Record<string, unknown>) => m.isActive !== false)
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => ((a.displayOrder as number) || (a.position as number) || 0) - ((b.displayOrder as number) || (b.position as number) || 0))
      .map((m: Record<string, unknown>) => ({
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
  } catch (error: unknown) {
    console.error("[API] Public team GET error:", getErrorMessage(error));
    return NextResponse.json({ members: [] });
  }
}
