// app/api/resources/route.ts
import { NextResponse } from "next/server";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

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
      `${getEndpoint()}/databases/${DATABASE_ID}/collections/resources/documents`,
      { headers: getHeaders(), cache: "no-store" }
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
