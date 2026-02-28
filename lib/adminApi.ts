// lib/adminApi.ts
// ═══════════════════════════════════════════════════════
// Centralized admin API helpers for Appwrite REST calls.
// Replaces duplicated getHeaders/getEndpoint/adminFetch
// across ~14 API route files.
//
// For new code, prefer using `adminDb` from `@/lib/appwrite/server`
// (node-appwrite SDK) instead of raw REST calls. This module
// exists for routes that still use the REST approach.
// ═══════════════════════════════════════════════════════

/**
 * Returns standard Appwrite admin headers for REST API calls.
 */
export function getAdminHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
    "X-Appwrite-Key": process.env.APPWRITE_API_KEY!,
  };
}

/**
 * Returns the Appwrite endpoint URL.
 */
export function getAppwriteEndpoint(): string {
  return process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
}

/**
 * Centralized admin fetch wrapper for Appwrite REST API.
 * Automatically prepends the endpoint and merges admin headers.
 *
 * @param path - The Appwrite REST path, e.g. `/databases/{dbId}/collections/{colId}/documents`
 * @param options - Standard RequestInit options (method, body, etc.)
 * @returns The fetch Response
 *
 * @example
 * ```ts
 * const res = await adminFetch(
 *   `/databases/${DATABASE_ID}/collections/events/documents`,
 *   { method: "GET" }
 * );
 * ```
 */
export async function adminFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${getAppwriteEndpoint()}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      ...getAdminHeaders(),
      ...((options.headers as Record<string, string>) || {}),
    },
  });
}

/**
 * Admin helper to delete a document via REST API with client-SDK fallback.
 */
export async function deleteDocumentAdmin(
  databaseId: string,
  collectionId: string,
  documentId: string
): Promise<true> {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    // Fallback: try node-appwrite SDK
    const { adminDb } = await import("@/lib/appwrite/server");
    await adminDb.deleteDocument(databaseId, collectionId, documentId);
    return true;
  }

  const response = await adminFetch(
    `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[adminApi] Delete error:", response.status, errorText);
    // Fallback to node-appwrite SDK
    try {
      const { adminDb } = await import("@/lib/appwrite/server");
      await adminDb.deleteDocument(databaseId, collectionId, documentId);
      return true;
    } catch {
      throw new Error(`Admin API delete failed: ${errorText}`);
    }
  }

  return true;
}

/**
 * Admin helper to update a document via REST API with client-SDK fallback.
 */
export async function updateDocumentAdmin(
  databaseId: string,
  collectionId: string,
  documentId: string,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    const { adminDb } = await import("@/lib/appwrite/server");
    return (await adminDb.updateDocument(
      databaseId,
      collectionId,
      documentId,
      data
    )) as unknown as Record<string, unknown>;
  }

  const response = await adminFetch(
    `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ data }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[adminApi] Update error:", response.status, errorText);
    try {
      const { adminDb } = await import("@/lib/appwrite/server");
      return (await adminDb.updateDocument(
        databaseId,
        collectionId,
        documentId,
        data
      )) as unknown as Record<string, unknown>;
    } catch {
      throw new Error(`Admin API update failed: ${errorText}`);
    }
  }

  return response.json();
}

