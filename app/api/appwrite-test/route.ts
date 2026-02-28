// app/api/appwrite-test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  try {
    // Only allow admin access to diagnostic endpoint
    const { isAdmin, error } = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json(
        { status: "error", message: error || "Not authorized" },
        { status: 403 }
      );
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;

    // Skip health check if running in build environment
    if (process.env.VERCEL_ENV === "production" && !endpoint) {
      return NextResponse.json({
        status: "warning",
        message: "Appwrite configuration not available during build",
        timestamp: new Date().toISOString(),
      });
    }

    // Test if endpoint is accessible
    let healthCheckNote = null;
    
    try {
      const endpointTest = await fetch(`${endpoint}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (endpointTest.ok) {
        healthCheckNote = "Health check passed";
      } else if (endpointTest.status === 401) {
        healthCheckNote = "Appwrite endpoint requires authentication (401) - This is normal for cloud instances";
      } else {
        healthCheckNote = `Health check returned status: ${endpointTest.status}`;
      }
    } catch (healthError: any) {
      healthCheckNote = `Health check error: ${healthError.message}`;
    }

    // Do not expose database IDs, bucket IDs, or project IDs in response
    return NextResponse.json({
      status: "success",
      message: "Appwrite configuration verified",
      endpointConfigured: !!endpoint,
      healthCheckNote: healthCheckNote,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Appwrite Test Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to connect to Appwrite",
      },
      { status: 500 }
    );
  }
}
