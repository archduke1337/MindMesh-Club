// lib/services/hackathon.service.ts
// ═══════════════════════════════════════════
// Hackathon Service — Teams, members, problem statements, submissions
// ═══════════════════════════════════════════

import { ID, Query } from "appwrite";
import { databases, storage } from "../appwrite";
import {
  DATABASE_ID,
  COLLECTION_IDS,
  BUCKET_IDS,
  type HackathonTeam,
  type CreateHackathonTeam,
  type TeamMember,
  type CreateTeamMember,
  type ProblemStatement,
  type Submission,
  type CreateSubmission,
  type UpdateSubmission,
  type EventResult,
} from "../types/appwrite";

// Generate a random 6-char invite code using crypto
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomBytes = new Uint8Array(6);
  crypto.getRandomValues(randomBytes);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(randomBytes[i] % chars.length);
  }
  return code;
}

export const hackathonService = {
  // ═══════════ TEAMS ═══════════

  async getTeamsByEvent(eventId: string): Promise<HackathonTeam[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.HACKATHON_TEAMS,
      [Query.equal("eventId", eventId), Query.orderDesc("$createdAt")]
    );
    return res.documents as unknown as HackathonTeam[];
  },

  async getTeamById(teamId: string): Promise<HackathonTeam> {
    return (await databases.getDocument(
      DATABASE_ID,
      COLLECTION_IDS.HACKATHON_TEAMS,
      teamId
    )) as unknown as HackathonTeam;
  },

  async getTeamByInviteCode(
    inviteCode: string
  ): Promise<HackathonTeam | null> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.HACKATHON_TEAMS,
      [Query.equal("inviteCode", inviteCode), Query.limit(1)]
    );
    return (res.documents[0] as unknown as HackathonTeam) || null;
  },

  async getUserTeam(
    eventId: string,
    userId: string
  ): Promise<HackathonTeam | null> {
    // Check if user is a team leader
    const leaderRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.HACKATHON_TEAMS,
      [
        Query.equal("eventId", eventId),
        Query.equal("leaderId", userId),
        Query.limit(1),
      ]
    );
    if (leaderRes.documents.length > 0) {
      return leaderRes.documents[0] as unknown as HackathonTeam;
    }

    // Check if user is a team member
    const memberRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.TEAM_MEMBERS,
      [
        Query.equal("eventId", eventId),
        Query.equal("userId", userId),
        Query.equal("status", "accepted"),
        Query.limit(1),
      ]
    );
    if (memberRes.documents.length > 0) {
      const tm = memberRes.documents[0] as unknown as TeamMember;
      return this.getTeamById(tm.teamId);
    }

    return null;
  },

  async createTeam(
    data: Omit<CreateHackathonTeam, "inviteCode" | "memberCount" | "status">
  ): Promise<HackathonTeam> {
    const teamData: CreateHackathonTeam = {
      ...data,
      inviteCode: generateInviteCode(),
      memberCount: 1,
      status: "forming",
    };

    const team = (await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.HACKATHON_TEAMS,
      ID.unique(),
      teamData
    )) as unknown as HackathonTeam;

    // Auto-add leader as team member
    await this.addMember({
      teamId: team.$id,
      eventId: data.eventId,
      userId: data.leaderId,
      name: data.leaderName,
      email: data.leaderEmail,
      role: "leader",
      status: "accepted",
      joinedAt: new Date().toISOString(),
    });

    return team;
  },

  async updateTeam(
    teamId: string,
    data: Partial<CreateHackathonTeam>
  ): Promise<HackathonTeam> {
    return (await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.HACKATHON_TEAMS,
      teamId,
      data
    )) as unknown as HackathonTeam;
  },

  async deleteTeam(teamId: string): Promise<void> {
    // Delete all team members first
    const members = await this.getTeamMembers(teamId);
    for (const m of members) {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_IDS.TEAM_MEMBERS,
        m.$id
      );
    }
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_IDS.HACKATHON_TEAMS,
      teamId
    );
  },

  // ═══════════ TEAM MEMBERS ═══════════

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.TEAM_MEMBERS,
      [Query.equal("teamId", teamId), Query.orderAsc("joinedAt")]
    );
    return res.documents as unknown as TeamMember[];
  },

  async addMember(data: CreateTeamMember): Promise<TeamMember> {
    return (await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.TEAM_MEMBERS,
      ID.unique(),
      data
    )) as unknown as TeamMember;
  },

  async removeMember(memberId: string): Promise<void> {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_IDS.TEAM_MEMBERS,
      memberId
    );
  },

  // ═══════════ PROBLEM STATEMENTS ═══════════

  async getProblemStatements(eventId: string): Promise<ProblemStatement[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.PROBLEM_STATEMENTS,
      [
        Query.equal("eventId", eventId),
        Query.equal("isVisible", true),
        Query.orderAsc("order"),
      ]
    );
    return res.documents as unknown as ProblemStatement[];
  },

  async createProblemStatement(
    data: Omit<ProblemStatement, keyof import("../types/appwrite").AppwriteDocument>
  ): Promise<ProblemStatement> {
    return (await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.PROBLEM_STATEMENTS,
      ID.unique(),
      data
    )) as unknown as ProblemStatement;
  },

  // ═══════════ SUBMISSIONS ═══════════

  async getSubmissionsByEvent(eventId: string): Promise<Submission[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.SUBMISSIONS,
      [Query.equal("eventId", eventId), Query.orderDesc("submittedAt")]
    );
    return res.documents as unknown as Submission[];
  },

  async getSubmissionByTeam(
    eventId: string,
    teamId: string
  ): Promise<Submission | null> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.SUBMISSIONS,
      [
        Query.equal("eventId", eventId),
        Query.equal("teamId", teamId),
        Query.limit(1),
      ]
    );
    return (res.documents[0] as unknown as Submission) || null;
  },

  async createSubmission(data: CreateSubmission): Promise<Submission> {
    return (await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.SUBMISSIONS,
      ID.unique(),
      {
        ...data,
        submittedAt: new Date().toISOString(),
        status: "submitted",
      }
    )) as unknown as Submission;
  },

  async updateSubmission(
    submissionId: string,
    data: UpdateSubmission
  ): Promise<Submission> {
    return (await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.SUBMISSIONS,
      submissionId,
      data
    )) as unknown as Submission;
  },

  async uploadSubmissionFile(file: File): Promise<string> {
    const res = await storage.createFile(
      BUCKET_IDS.SUBMISSION_FILES,
      ID.unique(),
      file
    );
    return storage
      .getFileView(BUCKET_IDS.SUBMISSION_FILES, res.$id)
      .toString();
  },

  // ═══════════ RESULTS ═══════════

  async getResults(eventId: string): Promise<EventResult | null> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.EVENT_RESULTS,
      [Query.equal("eventId", eventId), Query.limit(1)]
    );
    return (res.documents[0] as unknown as EventResult) || null;
  },

  async getPublishedResults(): Promise<EventResult[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.EVENT_RESULTS,
      [
        Query.equal("isPublished", true),
        Query.orderDesc("publishedAt"),
        Query.limit(20),
      ]
    );
    return res.documents as unknown as EventResult[];
  },
};
