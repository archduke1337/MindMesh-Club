// lib/services/team.service.ts
// Team Service -- CRUD for team members collection
import { ID, Query } from "appwrite";
import { databases, storage } from "../appwrite";
import {
  DATABASE_ID,
  COLLECTION_IDS,
  BUCKET_IDS,
} from "../types/appwrite";
// Legacy TeamMember interface for backward compat with database.ts consumers
export interface LegacyTeamMember {
  $id?: string;
  name: string;
  role: string;
  avatar: string;
  linkedin: string;
  github?: string;
  bio?: string;
  achievements?: string[];
  color: "primary" | "secondary" | "warning" | "danger" | "success";
  position: number;
  isActive: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}
export const teamService = {
  async getAllTeamMembers(queries: string[] = []): Promise<LegacyTeamMember[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.TEAM,
      [Query.orderAsc("position"), ...queries]
    );
    return res.documents as unknown as LegacyTeamMember[];
  },
  async getActiveTeamMembers(): Promise<LegacyTeamMember[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.TEAM,
      [Query.equal("isActive", true), Query.orderAsc("position")]
    );
    return res.documents as unknown as LegacyTeamMember[];
  },
  async getTeamMemberById(memberId: string): Promise<LegacyTeamMember> {
    const res = await databases.getDocument(DATABASE_ID, COLLECTION_IDS.TEAM, memberId);
    return res as unknown as LegacyTeamMember;
  },
  async createTeamMember(
    memberData: Omit<LegacyTeamMember, "$id" | "$createdAt" | "$updatedAt">
  ): Promise<LegacyTeamMember> {
    const res = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.TEAM,
      ID.unique(),
      memberData
    );
    return res as unknown as LegacyTeamMember;
  },
  async updateTeamMember(
    memberId: string,
    memberData: Partial<LegacyTeamMember>
  ): Promise<LegacyTeamMember> {
    const res = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.TEAM,
      memberId,
      memberData
    );
    return res as unknown as LegacyTeamMember;
  },
  async deleteTeamMember(memberId: string): Promise<boolean> {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_IDS.TEAM, memberId);
    return true;
  },
  async uploadTeamMemberAvatar(file: File): Promise<string> {
    const res = await storage.createFile(BUCKET_IDS.EVENT_IMAGES, ID.unique(), file);
    return storage.getFileView(BUCKET_IDS.EVENT_IMAGES, res.$id).toString();
  },
  async reorderTeamMembers(memberIds: string[]): Promise<boolean> {
    const updates = memberIds.map((id, index) =>
      databases.updateDocument(DATABASE_ID, COLLECTION_IDS.TEAM, id, { position: index })
    );
    await Promise.all(updates);
    return true;
  },
  async deactivateTeamMember(memberId: string): Promise<LegacyTeamMember> {
    return this.updateTeamMember(memberId, { isActive: false });
  },
  async activateTeamMember(memberId: string): Promise<LegacyTeamMember> {
    return this.updateTeamMember(memberId, { isActive: true });
  },
};