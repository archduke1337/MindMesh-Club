// lib/events/registration/handlers/team.handler.ts
// ═══════════════════════════════════════════════════════
// Team registration handler
// Used by: hackathon, competition (team mode)
// Creates team + registers leader, or joins existing team
// ═══════════════════════════════════════════════════════

import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from "@/lib/appwrite/server";
import { getEventTypeConfig } from "../../registry";
import {
  RegistrationHandler,
  TeamRegistrationInput,
  TeamJoinInput,
  RegistrationInput,
  RegistrationResult,
  EventContext,
} from "../types";
import { teamCreateSchema, teamJoinSchema } from "../schemas";
import { incrementRegisteredCount, decrementRegisteredCount } from "./individual.handler";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export const teamHandler: RegistrationHandler = {
  model: "team",

  async validate(input: RegistrationInput, eventData: EventContext): Promise<void> {
    // Determine if this is a create or join
    if ("inviteCode" in input) {
      teamJoinSchema.parse(input);
    } else {
      teamCreateSchema.parse(input);
    }

    const config = getEventTypeConfig(eventData.eventType);
    const teamConfig = config.registration.teamConfig;

    // For team creation, check team capacity (number of teams)
    if (!("inviteCode" in input) && eventData.capacity) {
      // Count existing teams, not individual registrations
      const teams = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.HACKATHON_TEAMS, [
        Query.equal("eventId", eventData.eventId),
        Query.limit(1),
      ]);
      // Use total count from the response
      if (teams.total >= eventData.capacity) {
        throw new Error("Event has reached maximum number of teams");
      }
    }

    // For team join, validate team exists and has space
    if ("inviteCode" in input) {
      const joinInput = input as TeamJoinInput;
      const teams = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.HACKATHON_TEAMS, [
        Query.equal("eventId", eventData.eventId),
        Query.equal("inviteCode", joinInput.inviteCode),
        Query.limit(1),
      ]);
      if (teams.documents.length === 0) {
        throw new Error("Invalid invite code");
      }
      const team = teams.documents[0];
      const maxSize = teamConfig?.maxSize || (team.maxSize as number) || 4;
      if ((team.memberCount as number) >= maxSize) {
        throw new Error("Team is full");
      }
      if (team.status !== "forming") {
        throw new Error("Team is no longer accepting members");
      }
    }
  },

  async execute(input: RegistrationInput, eventData: EventContext): Promise<RegistrationResult> {
    const config = getEventTypeConfig(eventData.eventType);
    const teamConfig = config.registration.teamConfig;

    // ── Team Join ───────────────────────────────────────
    if ("inviteCode" in input) {
      return handleTeamJoin(input as TeamJoinInput, eventData);
    }

    // ── Team Create ─────────────────────────────────────
    const createInput = input as TeamRegistrationInput;

    // Check if user already has a registration for this event
    const existingReg = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
      Query.equal("eventId", eventData.eventId),
      Query.equal("userId", createInput.userId),
      Query.limit(1),
    ]);

    if (existingReg.documents.length > 0) {
      const reg = existingReg.documents[0];
      return {
        success: true,
        registrationId: reg.$id,
        ticketId: reg.$id,
        status: "confirmed",
        teamId: (reg.teamId as string) || undefined,
        message: "Already registered for this event",
      };
    }

    // Create team
    const teamId = ID.unique();
    const inviteCode = generateInviteCode();
    const maxSize = createInput.maxSize || teamConfig?.maxSize || 4;

    await adminDb.createDocument(DATABASE_ID, COLLECTIONS.HACKATHON_TEAMS, teamId, {
      eventId: eventData.eventId,
      teamName: createInput.teamName,
      description: createInput.teamDescription || null,
      leaderId: createInput.userId,
      leaderName: createInput.userName,
      leaderEmail: createInput.userEmail,
      inviteCode,
      problemStatementId: null,
      memberCount: 1,
      maxSize,
      status: "forming",
      submissionId: null,
      teamLogo: null,
    });

    // Create team member entry for leader
    await adminDb.createDocument(DATABASE_ID, COLLECTIONS.TEAM_MEMBERS, ID.unique(), {
      teamId,
      eventId: eventData.eventId,
      userId: createInput.userId,
      name: createInput.userName,
      email: createInput.userEmail,
      role: "leader",
      status: "accepted",
      joinedAt: new Date().toISOString(),
    });

    // Create registration
    const ticketId = ID.unique();
    const ticketQRData = `TICKET|${ticketId}|${createInput.userName}|${eventData.title}|TEAM:${createInput.teamName}`;

    await adminDb.createDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, ticketId, {
      eventId: eventData.eventId,
      userId: createInput.userId,
      userName: createInput.userName,
      userEmail: createInput.userEmail,
      userPhone: createInput.userPhone || null,
      registeredAt: new Date().toISOString(),
      status: "confirmed",
      ticketQRData,
      teamId,
      checkInTime: null,
      source: "website",
      registrationModel: "team",
    });

    await incrementRegisteredCount(eventData.eventId);

    return {
      success: true,
      registrationId: ticketId,
      ticketId,
      status: "confirmed",
      teamId,
      inviteCode,
      message: `Team "${createInput.teamName}" created. Share invite code: ${inviteCode}`,
    };
  },

  async cancel(registrationId: string, eventData: EventContext): Promise<boolean> {
    // Get the registration to find teamId
    const reg = await adminDb.getDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, registrationId);
    const teamId = reg.teamId as string;
    const userId = reg.userId as string;

    // Remove team member
    if (teamId) {
      const members = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.TEAM_MEMBERS, [
        Query.equal("teamId", teamId),
        Query.equal("userId", userId),
        Query.limit(1),
      ]);
      if (members.documents.length > 0) {
        await adminDb.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.TEAM_MEMBERS,
          members.documents[0].$id
        );
      }

      // Update team member count
      const team = await adminDb.getDocument(DATABASE_ID, COLLECTIONS.HACKATHON_TEAMS, teamId);
      const newCount = Math.max(0, (team.memberCount as number) - 1);

      if (newCount === 0) {
        // Delete the team if no members left
        await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.HACKATHON_TEAMS, teamId);
      } else {
        await adminDb.updateDocument(DATABASE_ID, COLLECTIONS.HACKATHON_TEAMS, teamId, {
          memberCount: newCount,
        });
      }
    }

    // Delete registration
    await adminDb.deleteDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, registrationId);
    await decrementRegisteredCount(eventData.eventId);
    return true;
  },
};

// ── Team Join helper ────────────────────────────────────

async function handleTeamJoin(
  input: TeamJoinInput,
  eventData: EventContext
): Promise<RegistrationResult> {
  // Check duplicate
  const existingReg = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
    Query.equal("eventId", eventData.eventId),
    Query.equal("userId", input.userId),
    Query.limit(1),
  ]);

  if (existingReg.documents.length > 0) {
    const reg = existingReg.documents[0];
    return {
      success: true,
      registrationId: reg.$id,
      ticketId: reg.$id,
      status: "confirmed",
      teamId: (reg.teamId as string) || undefined,
      message: "Already registered for this event",
    };
  }

  // Find team
  const teams = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.HACKATHON_TEAMS, [
    Query.equal("eventId", eventData.eventId),
    Query.equal("inviteCode", input.inviteCode),
    Query.limit(1),
  ]);
  const team = teams.documents[0];
  const teamId = team.$id;

  // Add team member
  await adminDb.createDocument(DATABASE_ID, COLLECTIONS.TEAM_MEMBERS, ID.unique(), {
    teamId,
    eventId: eventData.eventId,
    userId: input.userId,
    name: input.userName,
    email: input.userEmail,
    role: "member",
    status: "accepted",
    joinedAt: new Date().toISOString(),
  });

  // Update member count
  await adminDb.updateDocument(DATABASE_ID, COLLECTIONS.HACKATHON_TEAMS, teamId, {
    memberCount: (team.memberCount as number) + 1,
  });

  // Create registration
  const ticketId = ID.unique();
  const ticketQRData = `TICKET|${ticketId}|${input.userName}|${eventData.title}|TEAM:${team.teamName}`;

  await adminDb.createDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, ticketId, {
    eventId: eventData.eventId,
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    userPhone: input.userPhone || null,
    registeredAt: new Date().toISOString(),
    status: "confirmed",
    ticketQRData,
    teamId,
    checkInTime: null,
    source: "website",
    registrationModel: "team",
  });

  await incrementRegisteredCount(eventData.eventId);

  return {
    success: true,
    registrationId: ticketId,
    ticketId,
    status: "confirmed",
    teamId,
    message: `Joined team "${team.teamName}" successfully`,
  };
}
