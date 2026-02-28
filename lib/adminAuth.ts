// lib/adminAuth.ts
/**
 * Admin Authentication and Authorization utilities.
 *
 * PRIMARY: Appwrite labels (user.labels includes "admin")
 * FALLBACK: Email-based check from lib/adminConfig.ts
 *
 * To promote a user to admin, add the "admin" label in the Appwrite Console
 * (Authentication → Users → select user → Labels → add "admin").
 * No redeployment required.
 */

import { Models } from "appwrite";
import { isUserAdminByEmail } from "./adminConfig";

export const ADMIN_ROLES = ["admin", "moderator", "owner"];

export interface AdminUser extends Models.User<Models.Preferences> {
  isAdmin?: boolean;
  role?: string;
}

/**
 * Check if user has admin access.
 * 1. Appwrite label "admin" (preferred — no redeploy needed)
 * 2. Email in ADMIN_EMAILS / NEXT_PUBLIC_ADMIN_EMAILS env var (legacy fallback)
 */
export function isUserAdmin(user: Models.User<Models.Preferences> | null): boolean {
  if (!user) return false;
  // Primary: Appwrite label
  if (user.labels?.includes("admin")) return true;
  // Fallback: email list
  return isUserAdminByEmail(user.email);
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
  
  // Default: email-based admins with no explicit role get full access
  // If you want to restrict, change this to false
  return isUserAdminByEmail(user.email);
}
