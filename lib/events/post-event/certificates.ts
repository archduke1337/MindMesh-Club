// lib/events/post-event/certificates.ts
// ═══════════════════════════════════════════════════════
// Certificate generation module.
// Builds certificate data per event type. PDF rendering
// is left to the UI layer (or a serverless function).
// ═══════════════════════════════════════════════════════

import { EventType } from "../types";
import { getCertificateConfig } from "./configs";
import type { CertificateData, CertificateType, ResultEntry } from "./types";

/**
 * Generate a unique certificate ID.
 * Format: CERT-{eventType prefix}-{random}
 */
function generateCertificateId(eventType: EventType): string {
  const prefix = eventType.slice(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${prefix}-${random}`;
}

/**
 * Resolve the certificate title from the template.
 */
function resolveTitle(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(`{${key}}`, value);
  }
  return result;
}

/**
 * Check if a participant is eligible for a certificate.
 * For completion-required types, checks attendance %.
 */
export function isEligibleForCertificate(
  eventType: EventType,
  certType: CertificateType,
  attendancePercent?: number
): boolean {
  const config = getCertificateConfig(eventType);

  if (!config.availableTypes.includes(certType)) return false;

  if (config.requiresCompletion && certType === "completion") {
    const minPercent = config.minAttendancePercent ?? 75;
    if (attendancePercent == null || attendancePercent < minPercent) return false;
  }

  return true;
}

/**
 * Build certificate data for a single recipient.
 */
export function buildCertificate(params: {
  recipientName: string;
  recipientEmail: string;
  eventTitle: string;
  eventType: EventType;
  eventDate: string;
  certType: CertificateType;
  rank?: number;
  prize?: string;
  topic?: string;
  completionPercent?: number;
}): CertificateData {
  const config = getCertificateConfig(params.eventType);
  const title = resolveTitle(config.titleTemplate, {
    eventTitle: params.eventTitle,
  });

  return {
    recipientName: params.recipientName,
    recipientEmail: params.recipientEmail,
    eventTitle: params.eventTitle,
    eventType: params.eventType,
    certType: params.certType,
    issuedAt: new Date().toISOString(),
    eventDate: params.eventDate,
    rank: params.rank,
    prize: params.prize,
    topic: params.topic,
    completionPercent: params.completionPercent,
    certificateId: generateCertificateId(params.eventType),
  };
}

/**
 * Batch-generate participation certificates for all confirmed registrations.
 */
export function buildParticipationCertificates(
  registrations: Array<{
    userName: string;
    userEmail: string;
    status: string;
    attendancePercent?: number;
  }>,
  eventTitle: string,
  eventType: EventType,
  eventDate: string
): CertificateData[] {
  const config = getCertificateConfig(eventType);
  const certType: CertificateType = config.requiresCompletion
    ? "completion"
    : "participation";

  return registrations
    .filter((reg) => {
      if (reg.status !== "confirmed" && reg.status !== "approved") return false;
      return isEligibleForCertificate(eventType, certType, reg.attendancePercent);
    })
    .map((reg) =>
      buildCertificate({
        recipientName: reg.userName,
        recipientEmail: reg.userEmail,
        eventTitle,
        eventType,
        eventDate,
        certType,
        completionPercent: reg.attendancePercent,
      })
    );
}

/**
 * Generate winner certificates from results.
 */
export function buildWinnerCertificates(
  results: ResultEntry[],
  eventTitle: string,
  eventType: EventType,
  eventDate: string,
  /** Map participant/team IDs to email addresses */
  emailLookup: Record<string, string>
): CertificateData[] {
  return results
    .filter((r) => r.rank <= 3)
    .map((entry) => {
      const certType: CertificateType =
        entry.rank === 1 ? "winner" : "runner-up";
      const name = entry.teamName || entry.participantName;
      const email = emailLookup[entry.participantId] || "";

      return buildCertificate({
        recipientName: name,
        recipientEmail: email,
        eventTitle,
        eventType,
        eventDate,
        certType,
        rank: entry.rank,
        prize: entry.prize,
      });
    });
}
