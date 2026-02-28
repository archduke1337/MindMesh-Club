// app/api/announcements/route.ts
// Announcements API — GET active announcements, POST/DELETE for admins
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = "announcements";

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

// GET /api/announcements — Active announcements (or all for admins with ?all=true)
export async function GET(request: NextRequest) {
  try {
    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`
    );
    if (!res.ok) {
      return NextResponse.json({ announcements: [] });
    }

    const data = await res.json();
    const documents = data.documents || [];

    // If admin requests all announcements (for admin panel)
    const showAll = request.nextUrl.searchParams.get("all") === "true";
    if (showAll) {
      const { isAdmin } = await verifyAdminAuth(request);
      if (isAdmin) {
        // Sort: pinned first, then by creation date
        documents.sort((a: any, b: any) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
        });
        return NextResponse.json({ announcements: documents });
      }
    }

    const now = new Date().toISOString();

    // Filter active and not expired
    const active = documents.filter((a: any) => {
      if (!a.isActive) return false;
      if (a.expiresAt && a.expiresAt < now) return false;
      return true;
    });

    // Sort: pinned first, then by creation date
    active.sort((a: any, b: any) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
    });

    return NextResponse.json({ announcements: active });
  } catch (error: any) {
    console.error("[API] Announcements GET error:", error);
    return NextResponse.json({ announcements: [] });
  }
}

// POST /api/announcements — Create announcement (admin)
export async function POST(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { title, content, type, priority, isPinned, eventId, link, linkText, createdBy, expiresAt } = body;

    if (!title || !content || !createdBy) {
      return NextResponse.json(
        { error: "title, content, and createdBy are required" },
        { status: 400 }
      );
    }

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
      {
        method: "POST",
        body: JSON.stringify({
          documentId: "unique()",
          data: {
            title,
            content,
            type: type || "info",
            priority: priority || "normal",
            isPinned: isPinned || false,
            isActive: true,
            eventId: eventId || null,
            link: link || null,
            linkText: linkText || null,
            createdBy,
            expiresAt: expiresAt || null,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const announcement = await res.json();
    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (error: any) {
    console.error("[API] Announcements POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/announcements — Update announcement (admin)
export async function PATCH(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { announcementId, ...updateFields } = body;

    if (!announcementId) {
      return NextResponse.json({ error: "announcementId is required" }, { status: 400 });
    }

    // Whitelist allowed fields
    const allowed = ["title", "content", "type", "priority", "isPinned", "isActive", "link", "linkText", "expiresAt"];
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (key in updateFields) {
        data[key] = updateFields[key];
      }
    }

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${announcementId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ data }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const announcement = await res.json();
    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    console.error("[API] Announcements PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/announcements — Delete announcement (admin)
export async function DELETE(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const { announcementId } = await request.json();

    if (!announcementId) {
      return NextResponse.json({ error: "announcementId is required" }, { status: 400 });
    }

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${announcementId}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API] Announcements DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
