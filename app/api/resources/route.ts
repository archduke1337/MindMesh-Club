// app/api/resources/route.ts
import { NextResponse } from "next/server";
import { adminFetch } from "@/lib/adminApi";
import { DATABASE_ID } from "@/lib/types/appwrite";

export async function GET() {
  try {
    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/resources/documents`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      return NextResponse.json({ resources: [] });
    }
    const data = await res.json();
    return NextResponse.json({ resources: data.documents || [] });
  } catch {
    return NextResponse.json({ resources: [] });
  }
}
