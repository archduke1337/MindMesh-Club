// app/api/admin/stats/route.ts
// Server-side admin stats endpoint — replaces client-side filtering
// Returns document counts using Appwrite's `total` field (no full document transfer)
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { adminFetch } from "@/lib/adminApi";
import { DATABASE_ID, COLLECTION_IDS } from "@/lib/types/appwrite";

/**
 * Helper to get a count via Appwrite REST — uses limit=1 and reads `total`.
 */
async function getCount(collectionId: string, queries: string[] = []): Promise<number> {
  const allQueries = [...queries, '{"method":"limit","values":[1]}'];
  const qs = allQueries.map((q) => `queries[]=${encodeURIComponent(q)}`).join("&");
  const res = await adminFetch(
    `/databases/${DATABASE_ID}/collections/${collectionId}/documents?${qs}`
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return data.total ?? 0;
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
      getCount(COLLECTION_IDS.BLOG),
      getCount(COLLECTION_IDS.BLOG, ['{"method":"equal","attribute":"status","values":["pending"]}']),
      getCount(COLLECTION_IDS.BLOG, ['{"method":"equal","attribute":"status","values":["approved"]}']),
      getCount(COLLECTION_IDS.BLOG, ['{"method":"equal","attribute":"status","values":["rejected"]}']),
      // Gallery counts
      getCount(COLLECTION_IDS.GALLERY),
      getCount(COLLECTION_IDS.GALLERY, ['{"method":"equal","attribute":"isApproved","values":[false]}']),
      // Event counts
      getCount(COLLECTION_IDS.EVENTS),
      getCount(COLLECTION_IDS.EVENTS, [
        `{"method":"greaterThanEqual","attribute":"date","values":["${new Date().toISOString().split("T")[0]}"]}`,
      ]),
    ]);

    return NextResponse.json({
      blogs: { total: blogTotal, pending: blogPending, approved: blogApproved, rejected: blogRejected },
      gallery: { total: galleryTotal, pending: galleryPending },
      events: { total: eventsTotal, upcoming: eventsUpcoming },
    });
  } catch (err: any) {
    console.error("[API] Admin stats error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stats", details: err.message },
      { status: 500 }
    );
  }
}

