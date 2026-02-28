// app/api/resources/route.ts
import { NextResponse } from "next/server";
import { adminDb, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/server";

export async function GET() {
  try {
    const data = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.RESOURCES
    );
    return NextResponse.json({ resources: data.documents || [] });
  } catch {
    return NextResponse.json({ resources: [] });
  }
}
