// lib/adminConfig.ts
/**
 * Admin configuration.
 *
 * SECURITY: Admin access is ONLY granted via Appwrite user labels.
 * To grant admin access:
 * 1. Go to Appwrite Console → Authentication → Users
 * 2. Select the user
 * 3. Go to Labels tab
 * 4. Add label: "admin"
 *
 * Email-based admin checks have been removed for security reasons.
 */

/**
 * Check if user has admin access via Appwrite labels.
 * This is the ONLY source of truth for admin authorization.
 */
export function isUserAdminByLabel(labels: string[] | undefined): boolean {
  if (!labels || labels.length === 0) return false;
  return labels.includes("admin");
}

/**
 * @deprecated Use isUserAdminByLabel instead. Email-based checks removed for security.
 */
export function isUserAdminByEmail(email: string | undefined): boolean {
  console.warn("isUserAdminByEmail is deprecated and always returns false. Use Appwrite labels instead.");
  return false;
}
