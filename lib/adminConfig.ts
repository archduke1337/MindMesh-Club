// lib/adminConfig.ts
/**
 * Centralized admin configuration
 * Used by both layout and AdminPageWrapper for consistent auth
 */

export const ADMIN_EMAILS: string[] = process.env.NEXT_PUBLIC_ADMIN_EMAILS
  ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(",").map(e => e.trim())
  : [
      "sahilmanecode@gmail.com",
      "mane50205@gmail.com",
      "gauravramyadav@gmail.com",
    ];

export function isUserAdminByEmail(email: string | undefined): boolean {
  if (!email) return false;
  // Case-insensitive email comparison (emails should always be lowercase, but be safe)
  const normalizedEmail = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === normalizedEmail);
}
