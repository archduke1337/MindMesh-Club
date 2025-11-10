// lib/adminConfig.ts
/**
 * Centralized admin configuration
 * Used by both layout and AdminPageWrapper for consistent auth
 */

export const ADMIN_EMAILS = [
  "sahilmanecode@gmail.com",
  "mane50205@gmail.com",
  "gauravramyadav@gmail.com",
];

export function isUserAdminByEmail(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}
