// lib/adminAuth.ts
/**
 * Admin Authentication and Authorization utilities.
 *
 * SECURITY: Admin access is ONLY granted via Appwrite user labels.
 * Email-based checks have been removed for security reasons.
 *
 * To promote a user to admin, add the "admin" label in the Appwrite Console
 * (Authentication → Users → select user → Labels → add "admin").
 * No redeployment required.
 */

import { Models } from "appwrite";

export const ADMIN_ROLES = ["admin", "moderator", "owner"];

export interface AdminUser extends Models.User<Models.Preferences> {
  isAdmin?: boolean;
  role?: string;
}

/**
 * Check if user has admin access via Appwrite labels.
 * This is the ONLY source of truth for admin authorization.
 */
export function isUserAdmin(user: Models.User<Models.Preferences> | null): boolean {
  if (!user) return false;
  return user.labels?.includes("admin") ?? false;
}

/**
 * Get user role from preferences
 */
export function getUserRole(user: Models.User<Models.Preferences> | null): string {
  if (!user || !user.prefs) return "user";
  
  const prefs = user.prefs as Record<string, string>;
  return prefs.role || "user";
}

/**
 * Check if user can perform action
 */
export function canUserPerformAction(
  user: Models.User<Models.Preferences> | null,
  action: "create" | "edit" | "delete" | "approve"
): boolean {
  if (!user || !isUserAdmin(user)) return false;
  
  const role = getUserRole(user);
  
  // Admin can perform all actions
  if (role === "admin") return true;
  
  // Moderator can create, edit, and approve — but NOT delete
  if (role === "moderator") {
    return ["create", "edit", "approve"].includes(action);
  }
  
  // Owner role can perform all actions
  if (role === "owner") return true;
  
  // Default: users with admin label but no explicit role get create/edit only
  return ["create", "edit"].includes(action);
}
