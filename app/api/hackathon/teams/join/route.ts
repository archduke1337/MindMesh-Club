// app/api/hackathon/teams/join/route.ts
// Join a hackathon team via invite code
import { NextRequest, NextResponse } from "next/server";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const TEAMS_COLLECTION = "hackathon_teams";
const MEMBERS_COLLECTION = "team_members";

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

// POST /api/hackathon/teams/join
export async function POST(request: NextRequest) {
  try {
    const { inviteCode, userId, userName, userEmail, eventId } = await request.json();

    if (!inviteCode || !userId || !userName || !userEmail) {
      return NextResponse.json(
        { error: "Missing: inviteCode, userId, userName, userEmail" },
        { status: 400 }
      );
    }

    // Find team by invite code
    const teamsRes = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${TEAMS_COLLECTION}/documents`
    );
    if (!teamsRes.ok) {
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
    }

    const teamsData = await teamsRes.json();
    const team = teamsData.documents?.find(
      (t: any) => t.inviteCode === inviteCode
    );

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
    if (team.memberCount >= team.maxSize) {
      return NextResponse.json(
        { error: `Team is full (${team.maxSize} members max)` },
        { status: 403 }
      );
    }

    // Check if user already in this team
    const membersRes = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${MEMBERS_COLLECTION}/documents`
    );
    const membersData = await membersRes.json();
    
    const existing = membersData.documents?.find(
      (m: any) =>
        m.teamId === team.$id &&
        m.userId === userId &&
        m.status === "accepted"
    );

    if (existing) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 409 }
      );
    }

    // Check if user already has another team for this event
    const otherTeam = teamsData.documents?.find(
      (t: any) => t.eventId === team.eventId && t.leaderId === userId
    );
    if (otherTeam) {
      return NextResponse.json(
        { error: "You already lead another team for this event" },
        { status: 409 }
      );
    }
    const otherMembership = membersData.documents?.find(
      (m: any) =>
        m.eventId === team.eventId &&
        m.userId === userId &&
        m.status === "accepted"
    );
    if (otherMembership) {
      return NextResponse.json(
        { error: "You are already part of another team for this event" },
        { status: 409 }
      );
    }

    // Add member
    const memberRes = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${MEMBERS_COLLECTION}/documents`,
      {
        method: "POST",
        body: JSON.stringify({
          documentId: "unique()",
          data: {
            teamId: team.$id,
            eventId: team.eventId,
            userId,
            name: userName,
            email: userEmail,
            role: "member",
            status: "accepted",
            joinedAt: new Date().toISOString(),
          },
        }),
      }
    );

    if (!memberRes.ok) {
      const errText = await memberRes.text();
      console.error("[API] Add member error:", errText);
      return NextResponse.json({ error: errText }, { status: memberRes.status });
    }

    // Increment team memberCount
    await adminFetch(
      `/databases/${DATABASE_ID}/collections/${TEAMS_COLLECTION}/documents/${team.$id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          data: { memberCount: team.memberCount + 1 },
        }),
      }
    );

    return NextResponse.json({
      success: true,
      teamName: team.teamName,
      message: `You have joined team "${team.teamName}"!`,
    });
  } catch (error: any) {
    console.error("[API] Join team error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
