// app/api/hackathon/judging/route.ts
// Manages judges, criteria, and scores for hackathon events
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, verifyAuth } from "@/lib/apiAuth";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

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

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// GET /api/hackathon/judging?eventId=xxx&type=judges|criteria|scores
export async function GET(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get("eventId");
    const type = request.nextUrl.searchParams.get("type") || "judges";

    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    let collectionId = "judges";
    if (type === "criteria") collectionId = "judging_criteria";
    if (type === "scores") collectionId = "judge_scores";

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${collectionId}/documents`
    );

    if (!res.ok) {
      return NextResponse.json({ items: [] });
    }

    const data = await res.json();
    const items = (data.documents || []).filter((d: any) => d.eventId === eventId);

    // Sort by order for judges/criteria
    if (type !== "scores") {
      items.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    }

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

// POST /api/hackathon/judging
// body: { action: "add_judge" | "add_criteria" | "submit_score" | "add_scores_bulk", ...data }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Admin-only actions: add_judge, add_criteria, add_scores_bulk
    if (["add_judge", "add_criteria", "add_scores_bulk"].includes(action)) {
      const admin = await verifyAdminAuth(request);
      if (!admin.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }

    // submit_score requires at least a logged-in user (the judge)
    if (action === "submit_score") {
      const auth = await verifyAuth(request);
      if (!auth.authenticated) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
    }

    if (action === "add_judge") {
      const { eventId, name, email, bio, expertise, organization, designation, linkedin, isLead, assignedTeams } = body;

      if (!eventId || !name || !email) {
        return NextResponse.json({ error: "eventId, name, email required" }, { status: 400 });
      }

      const res = await adminFetch(
        `/databases/${DATABASE_ID}/collections/judges/documents`,
        {
          method: "POST",
          body: JSON.stringify({
            documentId: "unique()",
            data: {
              eventId,
              userId: null,
              name,
              email,
              avatar: null,
              bio: bio || null,
              expertise: expertise || [],
              organization: organization || null,
              designation: designation || null,
              linkedin: linkedin || null,
              status: "invited",
              inviteCode: generateInviteCode(),
              assignedTeams: assignedTeams || [],
              isLead: isLead || false,
              order: body.order || 0,
            },
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }

      const doc = await res.json();
      return NextResponse.json({ judge: doc }, { status: 201 });
    }

    if (action === "add_criteria") {
      const { eventId, name, description, maxScore, weight, order } = body;

      if (!eventId || !name || maxScore == null || weight == null) {
        return NextResponse.json({ error: "eventId, name, maxScore, weight required" }, { status: 400 });
      }

      const res = await adminFetch(
        `/databases/${DATABASE_ID}/collections/judging_criteria/documents`,
        {
          method: "POST",
          body: JSON.stringify({
            documentId: "unique()",
            data: {
              eventId,
              name,
              description: description || null,
              maxScore,
              weight,
              order: order || 0,
            },
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }

      const doc = await res.json();
      return NextResponse.json({ criteria: doc }, { status: 201 });
    }

    if (action === "submit_score") {
      const {
        eventId, judgeId, judgeName, submissionId, teamId,
        criteriaId, criteriaName, score, comment,
      } = body;

      if (!eventId || !judgeId || !submissionId || !criteriaId || score == null) {
        return NextResponse.json({
          error: "eventId, judgeId, submissionId, criteriaId, score required",
        }, { status: 400 });
      }

      // Check for existing score (upsert)
      const existRes = await adminFetch(
        `/databases/${DATABASE_ID}/collections/judge_scores/documents`
      );
      if (existRes.ok) {
        const existData = await existRes.json();
        const existing = (existData.documents || []).find(
          (d: any) =>
            d.judgeId === judgeId && d.submissionId === submissionId && d.criteriaId === criteriaId
        );
        if (existing) {
          // Update existing score
          const updateRes = await adminFetch(
            `/databases/${DATABASE_ID}/collections/judge_scores/documents/${existing.$id}`,
            {
              method: "PATCH",
              body: JSON.stringify({
                data: { score, comment: comment || null, scoredAt: new Date().toISOString() },
              }),
            }
          );
          if (updateRes.ok) {
            const doc = await updateRes.json();
            return NextResponse.json({ score: doc });
          }
        }
      }

      // Create new score
      const res = await adminFetch(
        `/databases/${DATABASE_ID}/collections/judge_scores/documents`,
        {
          method: "POST",
          body: JSON.stringify({
            documentId: "unique()",
            data: {
              eventId,
              judgeId,
              judgeName: judgeName || "",
              submissionId,
              teamId: teamId || null,
              criteriaId,
              criteriaName: criteriaName || "",
              score,
              comment: comment || null,
              scoredAt: new Date().toISOString(),
            },
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }

      const doc = await res.json();
      return NextResponse.json({ score: doc }, { status: 201 });
    }

    // Bulk save scores (judge submits all criteria for one submission at once)
    if (action === "add_scores_bulk") {
      const { scores } = body; // Array of score objects
      if (!scores || !Array.isArray(scores)) {
        return NextResponse.json({ error: "scores array required" }, { status: 400 });
      }

      const results = [];
      for (const s of scores) {
        const innerRes = await fetch(request.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "submit_score", ...s }),
        });
        results.push(await innerRes.json());
      }

      return NextResponse.json({ results }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — update judge status, criteria, etc. (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, ...updateData } = body;

    if (!type || !id) {
      return NextResponse.json({ error: "type and id required" }, { status: 400 });
    }

    let collectionId = "judges";
    if (type === "criteria") collectionId = "judging_criteria";

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${collectionId}/documents/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ data: updateData }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const doc = await res.json();
    return NextResponse.json({ item: doc });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove judge or criteria (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { type, id } = await request.json();

    if (!type || !id) {
      return NextResponse.json({ error: "type and id required" }, { status: 400 });
    }

    let collectionId = "judges";
    if (type === "criteria") collectionId = "judging_criteria";

    const res = await adminFetch(
      `/databases/${DATABASE_ID}/collections/${collectionId}/documents/${id}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
