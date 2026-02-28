// app/api/hackathon/teams/join/route.ts
// Join a hackathon team via invite code
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { handleApiError, validateRequestBody, successResponse, ApiError } from "@/lib/apiErrorHandler";
import { z } from "zod";

// Validation schema
const joinTeamSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
  userId: z.string().min(1, "User ID is required"),
  userName: z.string().min(1, "User name is required"),
  userEmail: z.string().email("Invalid email address"),
  eventId: z.string().optional(),
});

// POST /api/hackathon/teams/join
export async function POST(request: NextRequest) {
  try {
    const { authenticated, user } = await verifyAuth(request);
    if (!authenticated || !user) {
      throw new ApiError(401, "Authentication required");
    }

    // Validate request body
    const data = await validateRequestBody(request, joinTeamSchema);

    // Find team by invite code
    const teamsResult = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.HACKATHON_TEAMS,
      [Query.equal("inviteCode", data.inviteCode)]
    );

    const team = teamsResult.documents[0];
    if (!team) {
      throw new ApiError(404, "Invalid invite code", "INVALID_INVITE_CODE");
    }

    // Check team status
    if (team.status === "locked" || team.status === "submitted") {
      throw new ApiError(403, "This team is locked and no longer accepting members", "TEAM_LOCKED");
    }

    // Check if team is full
    if ((team.memberCount as number) >= (team.maxSize as number)) {
      throw new ApiError(403, `Team is full (${team.maxSize} members max)`, "TEAM_FULL");
    }

    // Check if user already in this team
    const existingResult = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TEAM_MEMBERS,
      [
        Query.equal("teamId", team.$id),
        Query.equal("userId", data.userId),
        Query.equal("status", "accepted"),
      ]
    );

    if (existingResult.total > 0) {
      throw new ApiError(409, "You are already a member of this team", "ALREADY_MEMBER");
    }

    // Check if user already leads another team for this event
    const otherLeaderResult = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.HACKATHON_TEAMS,
      [
        Query.equal("eventId", team.eventId as string),
        Query.equal("leaderId", data.userId),
      ]
    );

    if (otherLeaderResult.total > 0) {
      throw new ApiError(409, "You already lead another team for this event", "ALREADY_LEADER");
    }

    // Check if user is already a member of another team for this event
    const otherMemberResult = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TEAM_MEMBERS,
      [
        Query.equal("eventId", team.eventId as string),
        Query.equal("userId", data.userId),
        Query.equal("status", "accepted"),
      ]
    );

    if (otherMemberResult.total > 0) {
      throw new ApiError(409, "You are already part of another team for this event", "ALREADY_IN_TEAM");
    }

    // Add member
    await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.TEAM_MEMBERS,
      ID.unique(),
      {
        teamId: team.$id,
        eventId: team.eventId,
        userId: data.userId,
        name: data.userName,
        email: data.userEmail,
        role: "member",
        status: "accepted",
        joinedAt: new Date().toISOString(),
      }
    );

    // Increment team memberCount
    await adminDb.updateDocument(
      DATABASE_ID,
      COLLECTIONS.HACKATHON_TEAMS,
      team.$id,
      { memberCount: (team.memberCount as number) + 1 }
    );

    return successResponse({
      teamName: team.teamName,
      message: `You have joined team "${team.teamName}"!`,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/hackathon/teams/join");
  }
}
