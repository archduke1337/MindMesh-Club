// app/api/admin/resources/route.ts
import { NextRequest, NextResponse } from "next/server";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = "resources";

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

// GET all resources
export async function GET() {
  try {
    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?queries[]=${encodeURIComponent('{"method":"limit","values":[100]}')}`
    );
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ resources: data.documents || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST create resource
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const documentId = `unique()`;

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
      {
        method: "POST",
        body: JSON.stringify({
          documentId,
          data: {
            title: body.title,
            description: body.description || null,
            type: body.type || "link",
            category: body.category || "General",
            url: body.url || null,
            fileUrl: body.fileUrl || null,
            eventId: body.eventId || null,
            eventName: body.eventName || null,
            difficulty: body.difficulty || "beginner",
            tags: body.tags || [],
            uploadedBy: body.uploadedBy || "",
            isApproved: body.isApproved ?? true,
            isFeatured: body.isFeatured ?? false,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ resource: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH update resource
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await request.json();
    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          data: {
            title: body.title,
            description: body.description || null,
            type: body.type,
            category: body.category,
            url: body.url || null,
            fileUrl: body.fileUrl || null,
            eventId: body.eventId || null,
            eventName: body.eventName || null,
            difficulty: body.difficulty,
            tags: body.tags || [],
            uploadedBy: body.uploadedBy,
            isApproved: body.isApproved,
            isFeatured: body.isFeatured,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ resource: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE resource
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${id}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
