// lib/appwrite.ts
// ──────────────────────────────────────────────────────
// Backward-compatibility shim.
// New code should import from:
//   "@/lib/appwrite/client"  — browser / "use client"
//   "@/lib/appwrite/server"  — API routes / server components
// ──────────────────────────────────────────────────────
import { Client, Account, Databases, Storage, ID, OAuthProvider } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const storage = new Storage(client);
export const databases = new Databases(client);

// ── Deprecated admin helpers — use @/lib/appwrite/server instead ──

/**
 * @deprecated Use `adminDb` from `@/lib/appwrite/server` instead.
 * Kept for backward compat — returns a node-appwrite Databases instance.
 */
export const createAdminDatabases = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { adminDb } = require("@/lib/appwrite/server");
  return adminDb;
};

/**
 * @deprecated Use `adminStorage` from `@/lib/appwrite/server` instead.
 * Kept for backward compat — returns a node-appwrite Storage instance.
 */
export const createAdminStorage = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { adminStorage } = require("@/lib/appwrite/server");
  return adminStorage;
};

// Export configuration (backward compat)
export const APPWRITE_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  projectsCollectionId: "projects",
  eventsCollectionId: "events",
  registrationsCollectionId: "registrations",
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
};

export { ID };

// Re-export authService from the new client module
export { authService } from "@/lib/appwrite/client";