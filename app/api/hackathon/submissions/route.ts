// app/api/hackathon/submissions/route.ts
// Project submission API for hackathon events
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { getErrorMessage } from "@/lib/errorHandler";

// GET /api/hackathon/submissions?eventId=xxx or ?teamId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const eventId = searchParams.get("eventId");
    const teamId = searchParams.get("teamId");

    const queries: string[] = [];
    if (eventId) queries.push(Query.equal("eventId", eventId));
    if (teamId) queries.push(Query.equal("teamId", teamId));

    const data = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SUBMISSIONS,
      queries
    );

    return NextResponse.json({ submissions: data.documents });
  } catch (error: unknown) {
    console.error("[API] Submissions GET error:", getErrorMessage(error));
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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
    if (teamId) {
      const existing = await adminDb.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SUBMISSIONS,
        [Query.equal("eventId", eventId), Query.equal("teamId", teamId)]
      );
      if (existing.total > 0) {
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

    const submission = await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.SUBMISSIONS,
      ID.unique(),
      submissionData
    );

    // Update team status to "submitted" if teamId provided
    if (teamId) {
      await adminDb.updateDocument(
        DATABASE_ID,
        COLLECTIONS.HACKATHON_TEAMS,
        teamId,
        { submissionId: submission.$id, status: "submitted" }
      );
    }

    return NextResponse.json(
      { success: true, submission },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[API] Submissions POST error:", getErrorMessage(error));
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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

    const submission = await adminDb.updateDocument(
      DATABASE_ID,
      COLLECTIONS.SUBMISSIONS,
      submissionId,
      updateData
    );

    return NextResponse.json({ success: true, submission });
  } catch (error: unknown) {
    console.error("[API] Submissions PATCH error:", getErrorMessage(error));
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
