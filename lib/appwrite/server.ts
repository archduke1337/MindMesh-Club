// lib/appwrite/server.ts
/**
 * Server-side Appwrite SDK initialisation using the official `node-appwrite` package.
 *
 * Usage in any API route:
 *   import { adminDb, adminStorage, adminUsers, DATABASE_ID } from "@/lib/appwrite/server";
 *   const docs = await adminDb.listDocuments(DATABASE_ID, "events");
 *
 * This replaces all the duplicated `adminFetch` / `getHeaders` / `getEndpoint`
 * boilerplate that was copy-pasted across ~20 API routes.
 */
import { Client, Databases, Storage, Users, ID, Query } from "node-appwrite";
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  DATABASE_ID as DB_ID,
  COLLECTIONS,
  BUCKETS,
} from "@/config/appwrite";

// ── Admin client (API-key based, server-only) ───────────

function createAdminClient() {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

  if (APPWRITE_API_KEY) {
    client.setKey(APPWRITE_API_KEY);
  }

  return client;
}

const adminClient = createAdminClient();

/** Databases service — use for CRUD on any collection */
export const adminDb = new Databases(adminClient);

/** Storage service — use for file uploads / deletes */
export const adminStorage = new Storage(adminClient);

/** Users service — use for managing user accounts / labels */
export const adminUsers = new Users(adminClient);

// Re-export helpers so API routes don't need extra imports
export { ID, Query };
export const DATABASE_ID = DB_ID;
export { COLLECTIONS, BUCKETS };
