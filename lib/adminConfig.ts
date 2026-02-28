// lib/adminConfig.ts
/**
 * Centralized admin configuration.
 *
 * PREFERRED: Assign the "admin" label to users in Appwrite Console.
 * This file provides a FALLBACK email-based check for backward compatibility.
 *
 * Client-side admin checks (UI) use AuthContext.isAdmin which checks
 * both user.labels.includes("admin") AND this email list.
 * Server-side admin checks are handled by middleware.ts + verifyAdminAuth.
 */

// Server-side admin emails (not exposed to client)
const SERVER_ADMIN_EMAILS: string[] = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map(e => e.trim())
  : [];

// Client-side admin emails (for UI-only checks like showing admin buttons)
const CLIENT_ADMIN_EMAILS: string[] = process.env.NEXT_PUBLIC_ADMIN_EMAILS
  ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(",").map(e => e.trim())
  : [];

// Combine both sources for backward compatibility
export const ADMIN_EMAILS: string[] = Array.from(new Set([...SERVER_ADMIN_EMAILS, ...CLIENT_ADMIN_EMAILS]));

export function isUserAdminByEmail(email: string | undefined): boolean {
  if (!email) return false;
  if (ADMIN_EMAILS.length === 0) return false;
  // Case-insensitive email comparison
  const normalizedEmail = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === normalizedEmail);
}
