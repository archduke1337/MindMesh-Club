// lib/services/club.service.ts
// ═══════════════════════════════════════════
// Club Members Service (team collection)
// ═══════════════════════════════════════════

import { ID, Query } from "appwrite";
import { databases } from "../appwrite";
import {
  DATABASE_ID,
  COLLECTION_IDS,
  type ClubMember,
  type CreateClubMember,
  type UpdateClubMember,
  type ClubMemberType,
} from "../types/appwrite";

export const clubService = {
  async getActive(): Promise<ClubMember[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.TEAM,
      [
        Query.equal("isActive", true),
        Query.orderAsc("displayOrder"),
        Query.limit(100),
      ]
    );
    return res.documents as unknown as ClubMember[];
  },

  async getByType(type: ClubMemberType): Promise<ClubMember[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.TEAM,
      [
        Query.equal("isActive", true),
        Query.equal("memberType", type),
        Query.orderAsc("displayOrder"),
      ]
    );
    return res.documents as unknown as ClubMember[];
  },

  async getFeatured(): Promise<ClubMember[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.TEAM,
      [
        Query.equal("isActive", true),
        Query.equal("isFeatured", true),
        Query.orderAsc("displayOrder"),
      ]
    );
    return res.documents as unknown as ClubMember[];
  },

  async getByDepartment(department: string): Promise<ClubMember[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.TEAM,
      [
        Query.equal("isActive", true),
        Query.equal("department", department),
        Query.orderAsc("displayOrder"),
      ]
    );
    return res.documents as unknown as ClubMember[];
  },

  async getAll(): Promise<ClubMember[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.TEAM,
      [Query.orderAsc("displayOrder"), Query.limit(200)]
    );
    return res.documents as unknown as ClubMember[];
  },

  async getById(id: string): Promise<ClubMember> {
    return (await databases.getDocument(
      DATABASE_ID,
      COLLECTION_IDS.TEAM,
      id
    )) as unknown as ClubMember;
  },

  async create(data: CreateClubMember): Promise<ClubMember> {
    return (await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.TEAM,
      ID.unique(),
      data
    )) as unknown as ClubMember;
  },

  async update(
    id: string,
    data: UpdateClubMember
  ): Promise<ClubMember> {
    return (await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.TEAM,
      id,
      data
    )) as unknown as ClubMember;
  },

  async delete(id: string): Promise<void> {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_IDS.TEAM,
      id
    );
  },

  async reorder(
    members: { id: string; displayOrder: number }[]
  ): Promise<void> {
    for (const m of members) {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.TEAM,
        m.id,
        { displayOrder: m.displayOrder }
      );
    }
  },
};
