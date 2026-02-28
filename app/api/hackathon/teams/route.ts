// app/api/hackathon/teams/route.ts
// Server-side API for hackathon team operations
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const TEAMS_COLLECTION = "hackathon_teams";
const MEMBERS_COLLECTION = "team_members";

function getEndpoint() {
  return process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
    "X-Appwrite-Key": process.env.APPWRITE_API_KEY!,
  };
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const endpoint = getEndpoint();
  return fetch(`${endpoint}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers as Record<string, string> || {}) },
  });
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
      const res = await adminFetch(
        `/databases/${DATABASE_ID}/collections/${TEAMS_COLLECTION}/documents`
      );
      if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
      }
      const data = await res.json();
      const team = data.documents?.find((d: any) => d.inviteCode === inviteCode);
      if (!team) {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
      }

      // Also fetch team members
      const membersRes = await adminFetch(
        `/databases/${DATABASE_ID}/collections/${MEMBERS_COLLECTION}/documents`
      );
      const membersData = await membersRes.json();
      const members = (membersData.documents || []).filter(
        (m: any) => m.teamId === team.$id
      );

      return NextResponse.json({ team, members });
    }

    if (userId && eventId) {
      // Check if user already has a team for this event
      const teamsRes = await adminFetch(
        `/databases/${DATABASE_ID}/collections/${TEAMS_COLLECTION}/documents`
      );
      const teamsData = await teamsRes.json();
      
      // Check as leader
      let userTeam = teamsData.documents?.find(
        (t: any) => t.eventId === eventId && t.leaderId === userId
      );

      if (!userTeam) {
        // Check as member
        const membersRes = await adminFetch(
          `/databases/${DATABASE_ID}/collections/${MEMBERS_COLLECTION}/documents`
        );
        const membersData = await membersRes.json();
        const membership = membersData.documents?.find(
          (m: any) =>
            m.eventId === eventId &&
            m.userId === userId &&
            m.status === "accepted"
        );
        if (membership) {
          userTeam = teamsData.documents?.find(
            (t: any) => t.$id === membership.teamId
          );
        }
      }

      return NextResponse.json({ team: userTeam || null });
    }

    if (eventId) {
      // Fetch all teams for event
      const res = await adminFetch(
        `/databases/${DATABASE_ID}/collections/${TEAMS_COLLECTION}/documents`
      );
      if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
      }
      const data = await res.json();
      const teams = (data.documents || []).filter(
        (t: any) => t.eventId === eventId
      );
      return NextResponse.json({ teams });
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
    const teamRes = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${TEAMS_COLLECTION}/documents`,
      {
        method: "POST",
        body: JSON.stringify({
          documentId: "unique()",
          data: {
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
          },
        }),
      }
    );

    if (!teamRes.ok) {
      const errText = await teamRes.text();
      console.error("[API] Create team error:", errText);
      return NextResponse.json({ error: errText }, { status: teamRes.status });
    }

    const team = await teamRes.json();

    // Auto-add leader as member
    await adminFetch(
      `/databases/${DATABASE_ID}/collections/${MEMBERS_COLLECTION}/documents`,
      {
        method: "POST",
        body: JSON.stringify({
          documentId: "unique()",
          data: {
            teamId: team.$id,
            eventId,
            userId: leaderId,
            name: leaderName,
            email: leaderEmail,
            role: "leader",
            status: "accepted",
            joinedAt: new Date().toISOString(),
          },
        }),
      }
    );

    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (error: any) {
    console.error("[API] Teams POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
