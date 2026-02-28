// app/api/hackathon/submissions/route.ts
// Project submission API for hackathon events
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const SUBMISSIONS_COLLECTION = "submissions";
const TEAMS_COLLECTION = "hackathon_teams";

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

async function adminFetch(path: string, options: RequestInit = {}) {
  return fetch(`${getEndpoint()}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers as Record<string, string> || {}) },
  });
}

// GET /api/hackathon/submissions?eventId=xxx or ?teamId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const eventId = searchParams.get("eventId");
    const teamId = searchParams.get("teamId");

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${SUBMISSIONS_COLLECTION}/documents`
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const data = await res.json();
    let submissions = data.documents || [];

    if (eventId) {
      submissions = submissions.filter((s: any) => s.eventId === eventId);
    }
    if (teamId) {
      submissions = submissions.filter((s: any) => s.teamId === teamId);
    }

    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error("[API] Submissions GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/hackathon/submissions — Create submission (auth required)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      eventId,
      teamId,
      userId,
      userName,
      projectTitle,
      projectDescription,
      problemStatementId,
      techStack,
      repoUrl,
      demoUrl,
      videoUrl,
      presentationUrl,
      screenshots,
      teamPhotoUrl,
      additionalNotes,
    } = body;

    if (!eventId || !userId || !userName || !projectTitle || !projectDescription) {
      return NextResponse.json(
        { error: "Missing required fields: eventId, userId, userName, projectTitle, projectDescription" },
        { status: 400 }
      );
    }

    // Check for existing submission from this team/user
    const existingRes = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${SUBMISSIONS_COLLECTION}/documents`
    );
    const existingData = await existingRes.json();
    
    if (teamId) {
      const existing = existingData.documents?.find(
        (s: any) => s.eventId === eventId && s.teamId === teamId
      );
      if (existing) {
        return NextResponse.json(
          { error: "Your team has already submitted a project for this event" },
          { status: 409 }
        );
      }
    }

    // Create submission
    const submissionData = {
      eventId,
      teamId: teamId || null,
      userId,
      userName,
      projectTitle,
      projectDescription,
      problemStatementId: problemStatementId || null,
      techStack: techStack || [],
      repoUrl: repoUrl || null,
      demoUrl: demoUrl || null,
      videoUrl: videoUrl || null,
      presentationUrl: presentationUrl || null,
      screenshots: screenshots || [],
      teamPhotoUrl: teamPhotoUrl || null,
      additionalNotes: additionalNotes || null,
      status: "submitted",
      submittedAt: new Date().toISOString(),
      reviewedBy: null,
      reviewNotes: null,
      totalScore: 0,
    };

    const createRes = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${SUBMISSIONS_COLLECTION}/documents`,
      {
        method: "POST",
        body: JSON.stringify({
          documentId: "unique()",
          data: submissionData,
        }),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("[API] Create submission error:", errText);
      return NextResponse.json({ error: errText }, { status: createRes.status });
    }

    const submission = await createRes.json();

    // Update team status to "submitted" if teamId provided
    if (teamId) {
      await adminFetch(
        `/databases/${DATABASE_ID}/collections/${TEAMS_COLLECTION}/documents/${teamId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            data: { submissionId: submission.$id, status: "submitted" },
          }),
        }
      );
    }

    return NextResponse.json(
      { success: true, submission },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API] Submissions POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/hackathon/submissions — Update submission (auth required)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId, ...updateData } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId is required" },
        { status: 400 }
      );
    }

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${SUBMISSIONS_COLLECTION}/documents/${submissionId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ data: updateData }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const submission = await res.json();
    return NextResponse.json({ success: true, submission });
  } catch (error: any) {
    console.error("[API] Submissions PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
