// app/api/hackathon/teams/route.ts
// Server-side API for hackathon team operations
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { handleApiError, ApiError, successResponse, validateRequestBody } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schemas
const createTeamSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  teamName: z.string().min(2, "Team name must be at least 2 characters").max(100, "Team name too long"),
  description: z.string().max(500, "Description too long").optional(),
  leaderId: z.string().min(1, "Leader ID is required"),
  leaderName: z.string().min(2, "Leader name is required"),
  leaderEmail: z.string().email("Invalid email"),
  maxSize: z.number().int().min(1).max(10).default(5),
});

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  return code;
}

// GET /api/hackathon/teams?eventId=xxx
// GET /api/hackathon/teams?inviteCode=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const eventId = searchParams.get("eventId");
    const inviteCode = searchParams.get("inviteCode");
    const userId = searchParams.get("userId");

    if (inviteCode) {
      // Fetch team by invite code
      const teamsResult = await adminDb.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HACKATHON_TEAMS,
        [Query.equal("inviteCode", inviteCode)]
      );

      const team = teamsResult.documents[0];
      if (!team) {
        throw new ApiError(404, "Invalid invite code");
      }

      // Also fetch team members
      const membersResult = await adminDb.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TEAM_MEMBERS,
        [Query.equal("teamId", team.$id)]
      );

      return successResponse({ team, members: membersResult.documents });
    }

    if (userId && eventId) {
      // Check if user already has a team for this event
      const leaderResult = await adminDb.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HACKATHON_TEAMS,
        [Query.equal("eventId", eventId), Query.equal("leaderId", userId)]
      );

      let userTeam = leaderResult.documents[0] || null;

      if (!userTeam) {
        // Check as member
        const memberResult = await adminDb.listDocuments(
          DATABASE_ID,
          COLLECTIONS.TEAM_MEMBERS,
          [
            Query.equal("eventId", eventId),
            Query.equal("userId", userId),
            Query.equal("status", "accepted"),
          ]
        );

        const membership = memberResult.documents[0];
        if (membership) {
          const teamDoc = await adminDb.getDocument(
            DATABASE_ID,
            COLLECTIONS.HACKATHON_TEAMS,
            membership.teamId as string
          );
          userTeam = teamDoc;
        }
      }

      return successResponse({ team: userTeam });
    }

    if (eventId) {
      // Fetch all teams for event
      const result = await adminDb.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HACKATHON_TEAMS,
        [Query.equal("eventId", eventId)]
      );

      return successResponse({ teams: result.documents });
    }

    throw new ApiError(400, "eventId or inviteCode required");
  } catch (error: unknown) {
    return handleApiError(error, "GET /api/hackathon/teams");
  }
}

// POST /api/hackathon/teams — Create team (auth required)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      throw new ApiError(401, "Authentication required");
    }

    const body = await validateRequestBody(request, createTeamSchema);

    const inviteCode = generateInviteCode();

    // Create team
    const team = await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.HACKATHON_TEAMS,
      ID.unique(),
      {
        eventId: body.eventId,
        teamName: body.teamName,
        description: body.description || null,
        leaderId: body.leaderId,
        leaderName: body.leaderName,
        leaderEmail: body.leaderEmail,
        inviteCode,
        problemStatementId: null,
        problemStatement: null,
        memberCount: 1,
        maxSize: body.maxSize,
        status: "forming",
        submissionId: null,
        teamLogo: null,
      }
    );

    // Auto-add leader as member
    await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.TEAM_MEMBERS,
      ID.unique(),
      {
        teamId: team.$id,
        eventId: body.eventId,
        userId: body.leaderId,
        name: body.leaderName,
        email: body.leaderEmail,
        role: "leader",
        status: "accepted",
        joinedAt: new Date().toISOString(),
      }
    );

    return successResponse({ team }, 201);
  } catch (error: unknown) {
    return handleApiError(error, "POST /api/hackathon/teams");
  }
}
