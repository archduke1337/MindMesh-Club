// app/api/admin/members/route.ts
// Admin API to list all member profiles
import { NextResponse } from "next/server";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = "member_profiles";

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

export async function GET() {
  try {
    const res = await fetch(
      `${getEndpoint()}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?queries[]=${encodeURIComponent('{"method":"limit","values":[500]}')}`,
      {
        headers: getHeaders(),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("[API] List members error:", errText);
      return NextResponse.json({ profiles: [] });
    }

    const data = await res.json();
    return NextResponse.json({ profiles: data.documents || [] });
  } catch (error: any) {
    console.error("[API] Admin members error:", error);
    return NextResponse.json({ profiles: [] });
  }
}
