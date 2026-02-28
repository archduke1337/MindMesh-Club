// app/api/hackathon/teams/join/route.ts
// Join a hackathon team via invite code
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { getErrorMessage } from "@/lib/errorHandler";

// POST /api/hackathon/teams/join
export async function POST(request: NextRequest) {
  const { authenticated } = await verifyAuth(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  try {
    const { inviteCode, userId, userName, userEmail, eventId } = await request.json();

    if (!inviteCode || !userId || !userName || !userEmail) {
      return NextResponse.json(
        { error: "Missing: inviteCode, userId, userName, userEmail" },
        { status: 400 }
      );
    }

    // Find team by invite code
    const teamsResult = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.HACKATHON_TEAMS,
      [Query.equal("inviteCode", inviteCode)]
    );

    const team = teamsResult.documents[0];
    if (!team) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    // Check team status
    if (team.status === "locked" || team.status === "submitted") {
      return NextResponse.json(
        { error: "This team is locked and no longer accepting members" },
        { status: 403 }
      );
    }

    // Check if team is full
    if ((team.memberCount as number) >= (team.maxSize as number)) {
      return NextResponse.json(
        { error: `Team is full (${team.maxSize} members max)` },
        { status: 403 }
      );
    }

    // Check if user already in this team
    const existingResult = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TEAM_MEMBERS,
      [
        Query.equal("teamId", team.$id),
        Query.equal("userId", userId),
        Query.equal("status", "accepted"),
      ]
    );

    if (existingResult.total > 0) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 409 }
      );
    }

    // Check if user already leads another team for this event
    const otherLeaderResult = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.HACKATHON_TEAMS,
      [
        Query.equal("eventId", team.eventId as string),
        Query.equal("leaderId", userId),
      ]
    );

    if (otherLeaderResult.total > 0) {
      return NextResponse.json(
        { error: "You already lead another team for this event" },
        { status: 409 }
      );
    }

    // Check if user is already a member of another team for this event
    const otherMemberResult = await adminDb.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TEAM_MEMBERS,
      [
        Query.equal("eventId", team.eventId as string),
        Query.equal("userId", userId),
        Query.equal("status", "accepted"),
      ]
    );

    if (otherMemberResult.total > 0) {
      return NextResponse.json(
        { error: "You are already part of another team for this event" },
        { status: 409 }
      );
    }

    // Add member
    await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.TEAM_MEMBERS,
      ID.unique(),
      {
        teamId: team.$id,
        eventId: team.eventId,
        userId,
        name: userName,
        email: userEmail,
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

    return NextResponse.json({
      success: true,
      teamName: team.teamName,
      message: `You have joined team "${team.teamName}"!`,
    });
  } catch (error: unknown) {
    console.error("[API] Join team error:", getErrorMessage(error));
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
