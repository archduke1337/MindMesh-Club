// lib/adminConfig.ts
/**
 * Centralized admin configuration
 * Used by both layout and AdminPageWrapper for consistent auth
 * 
 * NOTE: For client-side admin checks (UI display only), NEXT_PUBLIC_ADMIN_EMAILS is used.
 * For server-side auth, always verify via session cookie + Appwrite account API.
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
