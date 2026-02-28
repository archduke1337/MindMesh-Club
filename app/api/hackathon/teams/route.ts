// app/api/hackathon/teams/route.ts
// Server-side API for hackathon team operations
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
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
        return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
      }

      // Also fetch team members
      const membersResult = await adminDb.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TEAM_MEMBERS,
        [Query.equal("teamId", team.$id)]
      );

      return NextResponse.json({ team, members: membersResult.documents });
    }

    if (userId && eventId) {
      // Check if user already has a team for this event

      // Check as leader
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

      return NextResponse.json({ team: userTeam });
    }

    if (eventId) {
      // Fetch all teams for event
      const result = await adminDb.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HACKATHON_TEAMS,
        [Query.equal("eventId", eventId)]
      );

      return NextResponse.json({ teams: result.documents });
    }

    return NextResponse.json({ error: "eventId or inviteCode required" }, { status: 400 });
  } catch (error: any) {
    console.error("[API] Teams GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/hackathon/teams — Create team (auth required)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, teamName, description, leaderId, leaderName, leaderEmail, maxSize } = body;

    if (!eventId || !teamName || !leaderId || !leaderName || !leaderEmail) {
      return NextResponse.json(
        { error: "Missing: eventId, teamName, leaderId, leaderName, leaderEmail" },
        { status: 400 }
      );
    }

    const inviteCode = generateInviteCode();

    // Create team
    const team = await adminDb.createDocument(
      DATABASE_ID,
      COLLECTIONS.HACKATHON_TEAMS,
      ID.unique(),
      {
        eventId,
        teamName,
        description: description || null,
        leaderId,
        leaderName,
        leaderEmail,
        inviteCode,
        problemStatementId: null,
        problemStatement: null,
        memberCount: 1,
        maxSize: maxSize || 5,
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
        eventId,
        userId: leaderId,
        name: leaderName,
        email: leaderEmail,
        role: "leader",
        status: "accepted",
        joinedAt: new Date().toISOString(),
      }
    );

    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (error: any) {
    console.error("[API] Teams POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
