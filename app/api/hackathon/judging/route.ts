// app/api/hackathon/judging/route.ts
// Manages judges, criteria, and scores for hackathon events
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, verifyAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { getErrorMessage } from "@/lib/errorHandler";

function generateInviteCode() {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').substring(0, 10).toUpperCase();
}

function getCollectionId(type: string): string {
  if (type === "criteria") return COLLECTIONS.JUDGING_CRITERIA;
  if (type === "scores") return COLLECTIONS.JUDGE_SCORES;
  return COLLECTIONS.JUDGES;
}

// GET /api/hackathon/judging?eventId=xxx&type=judges|criteria|scores
export async function GET(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get("eventId");
    const type = request.nextUrl.searchParams.get("type") || "judges";

    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    const collectionId = getCollectionId(type);

    const result = await adminDb.listDocuments(
      DATABASE_ID,
      collectionId,
      [Query.equal("eventId", eventId)]
    );

    const items = result.documents;

    // Sort by order for judges/criteria
    if (type !== "scores") {
      items.sort((a: Record<string, unknown>, b: Record<string, unknown>) => ((a.order as number) || 0) - ((b.order as number) || 0));
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

      const doc = await adminDb.createDocument(
        DATABASE_ID,
        COLLECTIONS.JUDGES,
        ID.unique(),
        {
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
        }
      );

      return NextResponse.json({ judge: doc }, { status: 201 });
    }

    if (action === "add_criteria") {
      const { eventId, name, description, maxScore, weight, order } = body;

      if (!eventId || !name || maxScore == null || weight == null) {
        return NextResponse.json({ error: "eventId, name, maxScore, weight required" }, { status: 400 });
      }

      const doc = await adminDb.createDocument(
        DATABASE_ID,
        COLLECTIONS.JUDGING_CRITERIA,
        ID.unique(),
        {
          eventId,
          name,
          description: description || null,
          maxScore,
          weight,
          order: order || 0,
        }
      );

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
      const existResult = await adminDb.listDocuments(
        DATABASE_ID,
        COLLECTIONS.JUDGE_SCORES,
        [
          Query.equal("judgeId", judgeId),
          Query.equal("submissionId", submissionId),
          Query.equal("criteriaId", criteriaId),
        ]
      );

      if (existResult.documents.length > 0) {
        // Update existing score
        const existing = existResult.documents[0];
        const updatedDoc = await adminDb.updateDocument(
          DATABASE_ID,
          COLLECTIONS.JUDGE_SCORES,
          existing.$id,
          { score, comment: comment || null, scoredAt: new Date().toISOString() }
        );
        return NextResponse.json({ score: updatedDoc });
      }

      // Create new score
      const doc = await adminDb.createDocument(
        DATABASE_ID,
        COLLECTIONS.JUDGE_SCORES,
        ID.unique(),
        {
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
        }
      );

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
        const {
          eventId: sEventId, judgeId, judgeName, submissionId, teamId,
          criteriaId, criteriaName, score, comment,
        } = s;

        if (!sEventId || !judgeId || !submissionId || !criteriaId || score == null) {
          results.push({ error: "Missing required fields for score" });
          continue;
        }

        try {
          // Check for existing score (upsert)
          const existResult = await adminDb.listDocuments(
            DATABASE_ID,
            COLLECTIONS.JUDGE_SCORES,
            [
              Query.equal("judgeId", judgeId),
              Query.equal("submissionId", submissionId),
              Query.equal("criteriaId", criteriaId),
            ]
          );

          if (existResult.documents.length > 0) {
            const existing = existResult.documents[0];
            const updatedDoc = await adminDb.updateDocument(
              DATABASE_ID,
              COLLECTIONS.JUDGE_SCORES,
              existing.$id,
              { score, comment: comment || null, scoredAt: new Date().toISOString() }
            );
            results.push({ score: updatedDoc });
          } else {
            const createdDoc = await adminDb.createDocument(
              DATABASE_ID,
              COLLECTIONS.JUDGE_SCORES,
              ID.unique(),
              {
                eventId: sEventId,
                judgeId,
                judgeName: judgeName || "",
                submissionId,
                teamId: teamId || null,
                criteriaId,
                criteriaName: criteriaName || "",
                score,
                comment: comment || null,
                scoredAt: new Date().toISOString(),
              }
            );
            results.push({ score: createdDoc });
          }
        } catch (err: unknown) {
          results.push({ error: getErrorMessage(err) });
        }
      }

      return NextResponse.json({ results }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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

    const collectionId = getCollectionId(type);

    const doc = await adminDb.updateDocument(
      DATABASE_ID,
      collectionId,
      id,
      updateData
    );

    return NextResponse.json({ item: doc });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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

    const collectionId = getCollectionId(type);

    await adminDb.deleteDocument(DATABASE_ID, collectionId, id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
