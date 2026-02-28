// lib/services/projects.service.ts
// ═══════════════════════════════════════════
// Project Service — CRUD for projects collection
// ═══════════════════════════════════════════

import { ID, Query } from "appwrite";
import { databases } from "../appwrite";
import {
  DATABASE_ID,
  COLLECTION_IDS,
  type Project,
} from "../types/appwrite";

export const projectService = {
  // Get all projects
  async getAllProjects(queries: string[] = []): Promise<Project[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.PROJECTS,
      queries
    );
    return res.documents as unknown as Project[];
  },

  // Get project by ID
  async getProjectById(projectId: string): Promise<Project> {
    const res = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_IDS.PROJECTS,
      projectId
    );
    return res as unknown as Project;
  },

  // Get projects by category
  async getProjectsByCategory(category: string): Promise<Project[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.PROJECTS,
      [Query.equal("category", category)]
    );
    return res.documents as unknown as Project[];
  },

  // Get featured projects
  async getFeaturedProjects(): Promise<Project[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.PROJECTS,
      [Query.equal("isFeatured", true)]
    );
    return res.documents as unknown as Project[];
  },

  // Create project (Admin only)
  async createProject(
    projectData: Partial<Omit<Project, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$databaseId" | "$collectionId">>
  ): Promise<Project> {
    const dataWithStatus = {
      ...projectData,
      status: projectData.status || "planning",
    };
    const res = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.PROJECTS,
      ID.unique(),
      dataWithStatus
    );
    return res as unknown as Project;
  },

  // Update project (Admin only)
  async updateProject(projectId: string, projectData: Partial<Project>): Promise<Project> {
    const dataWithStatus = {
      ...projectData,
      ...(projectData.status !== undefined ? { status: projectData.status } : {}),
    };
    const res = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.PROJECTS,
      projectId,
      dataWithStatus
    );
    return res as unknown as Project;
  },

  // Delete project (Admin only)
  async deleteProject(projectId: string): Promise<boolean> {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_IDS.PROJECTS,
      projectId
    );
    return true;
  },
};

