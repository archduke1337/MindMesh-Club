// app/api/admin/stats/route.ts
// Server-side admin stats endpoint — replaces client-side filtering
// Returns document counts using Appwrite's `total` field (no full document transfer)
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";
import { getErrorMessage } from "@/lib/errorHandler";

/**
 * Helper to get a count via Appwrite SDK — uses limit=1 and reads `total`.
 */
async function getCount(collectionId: string, queries: string[] = []): Promise<number> {
  try {
    const result = await adminDb.listDocuments(DATABASE_ID, collectionId, [
      ...queries,
      Query.limit(1),
    ]);
    return result.total;
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Not authorized" }, { status: 401 });
  }

  try {
    // Run all counts in parallel for speed
    const [
      blogTotal,
      blogPending,
      blogApproved,
      blogRejected,
      galleryTotal,
      galleryPending,
      eventsTotal,
      eventsUpcoming,
    ] = await Promise.all([
      // Blog counts
      getCount(COLLECTIONS.BLOG),
      getCount(COLLECTIONS.BLOG, [Query.equal("status", "pending")]),
      getCount(COLLECTIONS.BLOG, [Query.equal("status", "approved")]),
      getCount(COLLECTIONS.BLOG, [Query.equal("status", "rejected")]),
      // Gallery counts
      getCount(COLLECTIONS.GALLERY),
      getCount(COLLECTIONS.GALLERY, [Query.equal("isApproved", false)]),
      // Event counts
      getCount(COLLECTIONS.EVENTS),
      getCount(COLLECTIONS.EVENTS, [
        Query.greaterThanEqual("date", new Date().toISOString().split("T")[0]),
      ]),
    ]);

    return NextResponse.json({
      blogs: { total: blogTotal, pending: blogPending, approved: blogApproved, rejected: blogRejected },
      gallery: { total: galleryTotal, pending: galleryPending },
      events: { total: eventsTotal, upcoming: eventsUpcoming },
    });
  } catch (err: unknown) {
    console.error("[API] Admin stats error:", getErrorMessage(err));
    return NextResponse.json(
      { error: "Failed to fetch stats", details: getErrorMessage(err) },
      { status: 500 }
    );
  }
}

