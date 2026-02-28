// lib/services/announcements.service.ts
// ═══════════════════════════════════════════
// Announcements Service
// ═══════════════════════════════════════════

import { ID, Query } from "appwrite";
import { databases } from "../appwrite";
import {
  DATABASE_ID,
  COLLECTION_IDS,
  type Announcement,
  type CreateAnnouncement,
  type UpdateAnnouncement,
} from "../types/appwrite";

export const announcementService = {
  async getActive(): Promise<Announcement[]> {
    const now = new Date().toISOString();
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.ANNOUNCEMENTS,
      [
        Query.equal("isActive", true),
        // Use server-side filter to exclude expired announcements
        Query.or([
          Query.isNull("expiresAt"),
          Query.greaterThan("expiresAt", now),
        ]),
        Query.orderDesc("$createdAt"),
        Query.limit(20),
      ]
    );
    return res.documents as unknown as Announcement[];
  },

  async getPinned(): Promise<Announcement[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.ANNOUNCEMENTS,
      [
        Query.equal("isActive", true),
        Query.equal("isPinned", true),
        Query.orderDesc("$createdAt"),
      ]
    );
    return res.documents as unknown as Announcement[];
  },

  async getAll(): Promise<Announcement[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.ANNOUNCEMENTS,
      [Query.orderDesc("$createdAt"), Query.limit(100)]
    );
    return res.documents as unknown as Announcement[];
  },

  async create(data: CreateAnnouncement): Promise<Announcement> {
    return (await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.ANNOUNCEMENTS,
      ID.unique(),
      data
    )) as unknown as Announcement;
  },

  async update(
    id: string,
    data: UpdateAnnouncement
  ): Promise<Announcement> {
    return (await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.ANNOUNCEMENTS,
      id,
      data
    )) as unknown as Announcement;
  },

  async delete(id: string): Promise<void> {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_IDS.ANNOUNCEMENTS,
      id
    );
  },
};
