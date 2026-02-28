// app/api/hackathon/submissions/route.ts
// Project submission API for hackathon events
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { handleApiError, validateRequestBody, successResponse, ApiError } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schemas
const createSubmissionSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  teamId: z.string().optional(),
  userId: z.string().min(1, "User ID is required"),
  userName: z.string().min(1, "User name is required"),
  projectTitle: z.string().min(3, "Project title must be at least 3 characters").max(200, "Project title too long"),
  projectDescription: z.string().min(50, "Project description must be at least 50 characters").max(5000, "Description too long"),
  problemStatementId: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  repoUrl: z.string().url("Invalid repository URL").optional(),
  demoUrl: z.string().url("Invalid demo URL").optional(),
  videoUrl: z.string().url("Invalid video URL").optional(),
  presentationUrl: z.string().url("Invalid presentation URL").optional(),
  screenshots: z.array(z.string().url()).default([]),
  teamPhotoUrl: z.string().url("Invalid team photo URL").optional(),
  additionalNotes: z.string().max(2000, "Additional notes too long").optional(),
});

const updateSubmissionSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  projectTitle: z.string().min(3).max(200).optional(),
  projectDescription: z.string().min(50).max(5000).optional(),
  techStack: z.array(z.string()).optional(),
  repoUrl: z.string().url().optional(),
  demoUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  presentationUrl: z.string().url().optional(),
  screenshots: z.array(z.string().url()).optional(),
  teamPhotoUrl: z.string().url().optional(),
  additionalNotes: z.string().max(2000).optional(),
});

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

    return successResponse({ submissions: data.documents });
  } catch (error) {
    return handleApiError(error, "GET /api/hackathon/submissions");
  }
}

// POST /api/hackathon/submissions — Create submission (auth required)
export async function POST(request: NextRequest) {
  try {
    const { authenticated, user } = await verifyAuth(request);
    if (!authenticated || !user) {
      throw new ApiError(401, "Authentication required");
    }

    // Validate request body
    const data = await validateRequestBody(request, createSubmissionSchema);

    // Check for existing submission from this team/user
    if (data.teamId) {
      const existing = await adminDb.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SUBMISSIONS,
        [Query.equal("eventId", data.eventId), Query.equal("teamId", data.teamId)]
      );
      if (existing.total > 0) {
        throw new ApiError(409, "Your team has already submitted a project for this event", "DUPLICATE_SUBMISSION");
      }
    }

    // Create submission
    const submissionData = {
      eventId: data.eventId,
      teamId: data.teamId || null,
      userId: data.userId,
      userName: data.userName,
      projectTitle: data.projectTitle,
      projectDescription: data.projectDescription,
      problemStatementId: data.problemStatementId || null,
      techStack: data.techStack,
      repoUrl: data.repoUrl || null,
      demoUrl: data.demoUrl || null,
      videoUrl: data.videoUrl || null,
      presentationUrl: data.presentationUrl || null,
      screenshots: data.screenshots,
      teamPhotoUrl: data.teamPhotoUrl || null,
      additionalNotes: data.additionalNotes || null,
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
    if (data.teamId) {
      await adminDb.updateDocument(
        DATABASE_ID,
        COLLECTIONS.HACKATHON_TEAMS,
        data.teamId,
        { submissionId: submission.$id, status: "submitted" }
      );
    }

    return successResponse({ submission, message: "Submission created successfully" }, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/hackathon/submissions");
  }
}

// PATCH /api/hackathon/submissions — Update submission (auth required)
export async function PATCH(request: NextRequest) {
  try {
    const { authenticated, user } = await verifyAuth(request);
    if (!authenticated || !user) {
      throw new ApiError(401, "Authentication required");
    }

    // Validate request body
    const { submissionId, ...updateData } = await validateRequestBody(request, updateSubmissionSchema);

    const submission = await adminDb.updateDocument(
      DATABASE_ID,
      COLLECTIONS.SUBMISSIONS,
      submissionId,
      updateData
    );

    return successResponse({ submission, message: "Submission updated successfully" });
  } catch (error) {
    return handleApiError(error, "PATCH /api/hackathon/submissions");
  }
}
