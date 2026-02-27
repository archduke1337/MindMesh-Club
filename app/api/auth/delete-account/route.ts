import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const cookieHeader = request.headers.get("cookie");

    if (!endpoint || !projectId || !cookieHeader) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get the current user via session cookie
    const userRes = await fetch(`${endpoint}/account`, {
      headers: {
        "X-Appwrite-Project": projectId,
        "Cookie": cookieHeader,
      },
    });

    if (!userRes.ok) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Delete the user's current session (log them out)
    await fetch(`${endpoint}/account/sessions/current`, {
      method: "DELETE",
      headers: {
        "X-Appwrite-Project": projectId,
        "Cookie": cookieHeader,
      },
    });

    // Use the admin API key to delete the user account
    const user = await userRes.json();
    const apiKey = process.env.APPWRITE_API_KEY;
    
    if (apiKey) {
      await fetch(`${endpoint}/users/${user.$id}`, {
        method: "DELETE",
        headers: {
          "X-Appwrite-Project": projectId,
          "X-Appwrite-Key": apiKey,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting account:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete account",
      },
      { status: 500 }
    );
  }
}
