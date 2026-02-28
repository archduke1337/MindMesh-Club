// lib/services/resources.service.ts
// ═══════════════════════════════════════════
// Resources & Roadmaps Service
// ═══════════════════════════════════════════

import { ID, Query } from "appwrite";
import { databases, storage } from "../appwrite";
import {
  DATABASE_ID,
  COLLECTION_IDS,
  BUCKET_IDS,
  type Resource,
  type Roadmap,
  type CreateRoadmap,
  type UpdateRoadmap,
  type ResourceType,
  type Difficulty,
} from "../types/appwrite";

export const resourceService = {
  // ── Resources ──

  async getApproved(limit = 50): Promise<Resource[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.RESOURCES,
      [
        Query.equal("isApproved", true),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ]
    );
    return res.documents as unknown as Resource[];
  },

  async getByType(type: ResourceType): Promise<Resource[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.RESOURCES,
      [
        Query.equal("type", type),
        Query.equal("isApproved", true),
        Query.orderDesc("$createdAt"),
      ]
    );
    return res.documents as unknown as Resource[];
  },

  async getByEvent(eventId: string): Promise<Resource[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.RESOURCES,
      [
        Query.equal("eventId", eventId),
        Query.equal("isApproved", true),
        Query.orderDesc("$createdAt"),
      ]
    );
    return res.documents as unknown as Resource[];
  },

  async search(query: string): Promise<Resource[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.RESOURCES,
      [
        Query.search("title", query),
        Query.equal("isApproved", true),
        Query.limit(20),
      ]
    );
    return res.documents as unknown as Resource[];
  },

  async create(
    data: Omit<Resource, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$databaseId" | "$collectionId">
  ): Promise<Resource> {
    return (await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.RESOURCES,
      ID.unique(),
      data
    )) as unknown as Resource;
  },

  async uploadFile(file: File): Promise<string> {
    const res = await storage.createFile(
      BUCKET_IDS.DOCUMENTS,
      ID.unique(),
      file
    );
    return storage
      .getFileView(BUCKET_IDS.DOCUMENTS, res.$id)
      .toString();
  },

  // ── Roadmaps ──

  async getRoadmaps(category?: string): Promise<Roadmap[]> {
    const queries = [
      Query.equal("isActive", true),
      Query.orderAsc("order"),
      Query.limit(50),
    ];
    if (category) {
      queries.unshift(Query.equal("category", category));
    }
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.ROADMAPS,
      queries
    );
    return res.documents as unknown as Roadmap[];
  },

  async getRoadmapCategories(): Promise<string[]> {
    const roadmaps = await this.getRoadmaps();
    return Array.from(new Set(roadmaps.map((r) => r.category)));
  },

  async createRoadmap(data: CreateRoadmap): Promise<Roadmap> {
    return (await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.ROADMAPS,
      ID.unique(),
      data
    )) as unknown as Roadmap;
  },

  async updateRoadmap(
    id: string,
    data: UpdateRoadmap
  ): Promise<Roadmap> {
    return (await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.ROADMAPS,
      id,
      data
    )) as unknown as Roadmap;
  },

  async deleteRoadmap(id: string): Promise<void> {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_IDS.ROADMAPS,
      id
    );
  },
};
