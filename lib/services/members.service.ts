// lib/services/members.service.ts
// ═══════════════════════════════════════════
// Member Profile Service — User profile completion, admin management
// ═══════════════════════════════════════════

import { ID, Query } from "appwrite";
import { databases } from "../appwrite";
import {
  DATABASE_ID,
  COLLECTION_IDS,
  type MemberProfile,
  type CreateMemberProfile,
  type UpdateMemberProfile,
  type MemberStatus,
} from "../types/appwrite";

export const memberService = {
  // ── QUERIES ──

  async getByUserId(userId: string): Promise<MemberProfile | null> {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.MEMBER_PROFILES,
        [Query.equal("userId", userId), Query.limit(1)]
      );
      return (res.documents[0] as unknown as MemberProfile) || null;
    } catch {
      return null;
    }
  },

  async getAll(
    queries: string[] = [],
    limit = 25,
    offset = 0
  ): Promise<{ profiles: MemberProfile[]; total: number }> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.MEMBER_PROFILES,
      [...queries, Query.limit(limit), Query.offset(offset)]
    );
    return {
      profiles: res.documents as unknown as MemberProfile[],
      total: res.total,
    };
  },

  async getByStatus(status: MemberStatus): Promise<MemberProfile[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.MEMBER_PROFILES,
      [Query.equal("memberStatus", status), Query.orderDesc("$createdAt")]
    );
    return res.documents as unknown as MemberProfile[];
  },

  async search(query: string): Promise<MemberProfile[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.MEMBER_PROFILES,
      [Query.search("name", query), Query.limit(20)]
    );
    return res.documents as unknown as MemberProfile[];
  },

  // ── MUTATIONS ──

  async create(data: CreateMemberProfile): Promise<MemberProfile> {
    const res = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.MEMBER_PROFILES,
      ID.unique(),
      data
    );
    return res as unknown as MemberProfile;
  },

  async update(
    profileId: string,
    data: UpdateMemberProfile
  ): Promise<MemberProfile> {
    const res = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.MEMBER_PROFILES,
      profileId,
      data
    );
    return res as unknown as MemberProfile;
  },

  async updateStatus(
    profileId: string,
    status: MemberStatus
  ): Promise<MemberProfile> {
    return this.update(profileId, { memberStatus: status });
  },

  async delete(profileId: string): Promise<void> {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_IDS.MEMBER_PROFILES,
      profileId
    );
  },

  // ── HELPERS ──

  async isProfileComplete(userId: string): Promise<boolean> {
    const profile = await this.getByUserId(userId);
    return !!profile;
  },
};
