// app/api/resources/roadmaps/route.ts
import { NextResponse } from "next/server";
import { adminDb, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/server";

export async function GET() {
  try {
    const data = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ROADMAPS
    );
    return NextResponse.json({ roadmaps: data.documents || [] });
  } catch {
    return NextResponse.json({ roadmaps: [] });
  }
}
