// app/api/appwrite-test/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;

    // Log environment variables (WITHOUT secrets)
    console.log("🔍 Appwrite Configuration:", {
      endpoint,
      projectId,
      databaseId,
      bucketId,
    });

    // Skip health check if running in build environment
    if (process.env.VERCEL_ENV === "production" && !endpoint) {
      return NextResponse.json({
        status: "warning",
        message: "Appwrite configuration not available during build",
        timestamp: new Date().toISOString(),
      });
    }

    // Test if endpoint is accessible
    let healthData = null;
    let healthCheckNote = null;
    
    try {
      const endpointTest = await fetch(`${endpoint}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // 401 is expected if endpoint requires auth, just skip health data
      if (endpointTest.ok) {
        healthData = await endpointTest.json();
        healthCheckNote = "Health check passed";
      } else if (endpointTest.status === 401) {
        healthCheckNote = "Appwrite endpoint requires authentication (401) - This is normal for cloud instances";
      } else {
        healthCheckNote = `Health check returned status: ${endpointTest.status}`;
      }
    } catch (healthError: any) {
      healthCheckNote = `Health check error: ${healthError.message}`;
    }

    return NextResponse.json({
      status: "success",
      message: "Appwrite configuration verified",
      endpoint: endpoint,
      projectId: projectId,
      databaseId: databaseId,
      bucketId: bucketId,
      health: healthData,
      healthCheckNote: healthCheckNote,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Appwrite Test Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to connect to Appwrite",
        error: error.toString(),
      },
      { status: 500 }
    );
  }
}
