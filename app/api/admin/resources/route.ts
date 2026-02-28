// app/api/admin/resources/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { getErrorMessage } from "@/lib/errorHandler";

// GET all resources
export async function GET(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const data = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, [
      Query.limit(100),
    ]);
    return NextResponse.json({ resources: data.documents || [] });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

// POST create resource
export async function POST(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const body = await request.json();

    const data = await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.RESOURCES,
      ID.unique(),
      {
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
      }
    );

    return NextResponse.json({ resource: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

// PATCH update resource
export async function PATCH(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await request.json();
    const data = await adminDb.updateDocument(
      DATABASE_ID,
      COLLECTIONS.RESOURCES,
      id,
      {
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
      }
    );

    return NextResponse.json({ resource: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

// DELETE resource
export async function DELETE(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.RESOURCES, id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
