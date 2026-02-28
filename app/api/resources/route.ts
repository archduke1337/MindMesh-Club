// app/api/resources/route.ts
import { NextRequest } from "next/server";
import { adminDb, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/server";
import { handleApiError, successResponse } from "@/lib/apiErrorHandler";

export async function GET(request: NextRequest) {
  try {
    const data = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.RESOURCES
    );
    return successResponse({ resources: data.documents || [] });
  } catch (error) {
    return handleApiError(error, "GET /api/resources");
  }
}
