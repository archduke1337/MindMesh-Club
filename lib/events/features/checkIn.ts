// lib/events/features/check-in.ts
// ═══════════════════════════════════════════════════════
// Type-aware check-in module
// Handles different check-in models per event type
// ═══════════════════════════════════════════════════════

import { adminDb, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";
import { CheckInModel, EventType } from "../types";
import { getEventTypeConfig } from "../registry";
import { CheckInRecord } from "./types";

/**
 * Process a check-in based on the event type's check-in model.
 */
export async function processCheckIn(
  registrationId: string,
  eventType: EventType,
  options?: { day?: number }
): Promise<{ success: boolean; message: string; record?: CheckInRecord }> {
  const config = getEventTypeConfig(eventType);
  const model = config.ticket.checkInModel || "none";

  switch (model) {
    case "individual":
      return handleIndividualCheckIn(registrationId);
    case "team":
      return handleTeamCheckIn(registrationId);
    case "daily":
      return handleDailyCheckIn(registrationId, options?.day || 1);
    case "gate":
      return handleGateCheckIn(registrationId);
    case "none":
    case "auto":
      return { success: false, message: "Check-in not required for this event type" };
    default:
      return { success: false, message: `Unknown check-in model: ${model}` };
  }
}

/**
 * Individual check-in — standard QR scan, one-time.
 */
async function handleIndividualCheckIn(
  registrationId: string
): Promise<{ success: boolean; message: string; record?: CheckInRecord }> {
  const reg = await adminDb.getDocument(
    DATABASE_ID,
    COLLECTIONS.REGISTRATIONS,
    registrationId
  );

  if (reg.status === "checked_in") {
    return {
      success: false,
      message: `Already checked in at ${reg.checkInTime}`,
    };
  }

  if (reg.status !== "confirmed") {
    return {
      success: false,
      message: `Cannot check in — registration status is ${reg.status}`,
    };
  }

  const checkInTime = new Date().toISOString();
  await adminDb.updateDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, registrationId, {
    status: "checked_in",
    checkInTime,
  });

  return {
    success: true,
    message: `${reg.userName} checked in successfully`,
    record: {
      registrationId,
      userId: reg.userId as string,
      userName: reg.userName as string,
      checkInTime,
      checkInType: "individual",
    },
  };
}

/**
 * Team check-in — check in the whole team when any member scans.
 */
async function handleTeamCheckIn(
  registrationId: string
): Promise<{ success: boolean; message: string; record?: CheckInRecord }> {
  const reg = await adminDb.getDocument(
    DATABASE_ID,
    COLLECTIONS.REGISTRATIONS,
    registrationId
  );

  const teamId = reg.teamId as string;
  if (!teamId) {
    // Fallback to individual if no team
    return handleIndividualCheckIn(registrationId);
  }

  // Check in all team members
  const teamRegs = await adminDb.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
    Query.equal("teamId", teamId),
    Query.limit(20),
  ]);

  const checkInTime = new Date().toISOString();
  let checkedIn = 0;

  for (const teamReg of teamRegs.documents) {
    if (teamReg.status === "confirmed") {
      await adminDb.updateDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, teamReg.$id, {
        status: "checked_in",
        checkInTime,
      });
      checkedIn++;
    }
  }

  return {
    success: true,
    message: `Team checked in (${checkedIn} members)`,
    record: {
      registrationId,
      userId: reg.userId as string,
      userName: reg.userName as string,
      checkInTime,
      checkInType: "team",
    },
  };
}

/**
 * Daily check-in — for multi-day events like bootcamps.
 * Allows multiple check-ins (one per day).
 */
async function handleDailyCheckIn(
  registrationId: string,
  day: number
): Promise<{ success: boolean; message: string; record?: CheckInRecord }> {
  const reg = await adminDb.getDocument(
    DATABASE_ID,
    COLLECTIONS.REGISTRATIONS,
    registrationId
  );

  if (reg.status !== "confirmed" && reg.status !== "checked_in") {
    return {
      success: false,
      message: `Cannot check in — registration status is ${reg.status}`,
    };
  }

  // Store daily check-ins in extraFields
  let extraData: Record<string, unknown> = {};
  try {
    extraData = reg.extraFields ? JSON.parse(reg.extraFields as string) : {};
  } catch {
    extraData = {};
  }

  const dailyCheckIns = (extraData.dailyCheckIns as Record<string, string>) || {};
  const dayKey = `day_${day}`;

  if (dailyCheckIns[dayKey]) {
    return {
      success: false,
      message: `Already checked in for Day ${day}`,
    };
  }

  const checkInTime = new Date().toISOString();
  dailyCheckIns[dayKey] = checkInTime;
  extraData.dailyCheckIns = dailyCheckIns;

  await adminDb.updateDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, registrationId, {
    status: "checked_in",
    checkInTime,
    extraFields: JSON.stringify(extraData),
  });

  return {
    success: true,
    message: `Day ${day} check-in successful for ${reg.userName}`,
    record: {
      registrationId,
      userId: reg.userId as string,
      userName: reg.userName as string,
      checkInTime,
      checkInDay: day,
      checkInType: "daily",
    },
  };
}

/**
 * Gate check-in — for fests. Tracks entry/re-entry.
 */
async function handleGateCheckIn(
  registrationId: string
): Promise<{ success: boolean; message: string; record?: CheckInRecord }> {
  const reg = await adminDb.getDocument(
    DATABASE_ID,
    COLLECTIONS.REGISTRATIONS,
    registrationId
  );

  if (reg.status !== "confirmed" && reg.status !== "checked_in") {
    return {
      success: false,
      message: `Cannot check in — registration status is ${reg.status}`,
    };
  }

  const checkInTime = new Date().toISOString();

  // Gate check-in always updates time (re-entry tracking)
  await adminDb.updateDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, registrationId, {
    status: "checked_in",
    checkInTime,
  });

  return {
    success: true,
    message: `${reg.userName} entered`,
    record: {
      registrationId,
      userId: reg.userId as string,
      userName: reg.userName as string,
      checkInTime,
      checkInType: "gate",
    },
  };
}

/**
 * Get check-in statistics for an event.
 */
export async function getCheckInStats(eventId: string) {
  const [total, checkedIn] = await Promise.all([
    adminDb.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
      Query.equal("eventId", eventId),
      Query.equal("status", "confirmed"),
      Query.limit(1),
    ]),
    adminDb.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
      Query.equal("eventId", eventId),
      Query.equal("status", "checked_in"),
      Query.limit(1),
    ]),
  ]);

  const totalConfirmed = total.total + checkedIn.total;

  return {
    totalRegistered: totalConfirmed,
    checkedIn: checkedIn.total,
    pending: total.total,
    percentage: totalConfirmed > 0 ? Math.round((checkedIn.total / totalConfirmed) * 100) : 0,
  };
}
