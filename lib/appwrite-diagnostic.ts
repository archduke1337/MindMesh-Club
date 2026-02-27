// lib/appwrite-diagnostic.ts
/**
 * Diagnostic tool to test Appwrite connectivity
 * Run this in browser console or in your app
 */

export async function testAppwriteConnectivity() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  console.log("🔍 Testing Appwrite Connectivity...");
  console.log("Endpoint:", endpoint);
  console.log("Project ID:", projectId);

  try {
    // Test 1: Direct endpoint health check
    console.log("\n📍 Test 1: Checking endpoint health...");
    const healthResponse = await fetch(`${endpoint}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Health check status:", healthResponse.status);
    const healthData = await healthResponse.json();
    console.log("Health data:", healthData);

    if (!healthResponse.ok) {
      throw new Error(`Health check failed with status ${healthResponse.status}`);
    }

    console.log("✅ Endpoint is reachable!");

    return {
      status: "success",
      message: "Appwrite endpoint is reachable",
      endpoint: endpoint,
      projectId: projectId,
      health: healthData,
    };
  } catch (error: any) {
    console.error("❌ Connectivity test failed:", error);
    return {
      status: "error",
      message: error.message,
      endpoint: endpoint,
      projectId: projectId,
      error: error.toString(),
    };
  }
}

export async function testAppwriteProject() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  console.log("\n📍 Test 2: Checking project access...");

  try {
    const projectResponse = await fetch(`${endpoint}/projects/${projectId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // NOTE: API key should only be used server-side. This diagnostic should be run from an API route.
        "X-Appwrite-Key": process.env.APPWRITE_API_KEY || "",
      },
    });

    console.log("Project check status:", projectResponse.status);

    if (projectResponse.status === 401) {
      console.warn("⚠️ Unauthorized - API key may be missing or invalid");
    } else if (projectResponse.status === 404) {
      console.error("❌ Project not found - check Project ID");
    } else if (projectResponse.ok) {
      console.log("✅ Project is accessible!");
      const projectData = await projectResponse.json();
      return projectData;
    }
  } catch (error: any) {
    console.error("❌ Project access test failed:", error);
  }
}

// Export for browser console (development only)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).testAppwriteConnectivity = testAppwriteConnectivity;
  (window as any).testAppwriteProject = testAppwriteProject;
}
