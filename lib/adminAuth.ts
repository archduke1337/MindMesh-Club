// lib/adminAuth.ts
/**
 * Admin Authentication and Authorization utilities
 * NOTE: The main admin auth uses email-based checks from lib/adminConfig.ts
 * This file provides role-based checks as a supplement for future role-based RBAC
 */

import { Models } from "appwrite";
import { isUserAdminByEmail } from "./adminConfig";

export const ADMIN_ROLES = ["admin", "moderator", "owner"];

export interface AdminUser extends Models.User<Models.Preferences> {
  isAdmin?: boolean;
  role?: string;
}

/**
 * Check if user has admin access (uses email-based system)
 * This is the primary method used throughout the app
 */
export function isUserAdmin(user: Models.User<Models.Preferences> | null): boolean {
  if (!user) return false;
  // Use email-based admin check from adminConfig
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
