// lib/services/events.service.ts
// ═══════════════════════════════════════════
// Event Service — CRUD + queries for events collection
// ═══════════════════════════════════════════

import { ID, Query } from "appwrite";
import { databases, storage } from "../appwrite";
import {
  DATABASE_ID,
  COLLECTION_IDS,
  BUCKET_IDS,
  type Event,
  type CreateEvent,
  type UpdateEvent,
  type EventType,
} from "../types/appwrite";

export const eventService = {
  // ── QUERIES ──

  async getAll(queries: string[] = []): Promise<Event[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.EVENTS,
      queries
    );
    return res.documents as unknown as Event[];
  },

  async getById(eventId: string): Promise<Event> {
    const res = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_IDS.EVENTS,
      eventId
    );
    return res as unknown as Event;
  },

  async getUpcoming(limit = 20): Promise<Event[]> {
    const now = new Date().toISOString();
    return this.getAll([
      Query.greaterThanEqual("date", now),
      Query.orderAsc("date"),
      Query.limit(limit),
    ]);
  },

  async getPast(limit = 20): Promise<Event[]> {
    const now = new Date().toISOString();
    return this.getAll([
      Query.lessThan("date", now),
      Query.orderDesc("date"),
      Query.limit(limit),
    ]);
  },

  async getByType(eventType: EventType, limit = 20): Promise<Event[]> {
    return this.getAll([
      Query.equal("eventType", eventType),
      Query.orderDesc("date"),
      Query.limit(limit),
    ]);
  },

  async getFeatured(limit = 6): Promise<Event[]> {
    return this.getAll([
      Query.equal("isFeatured", true),
      Query.orderDesc("date"),
      Query.limit(limit),
    ]);
  },

  async search(query: string, limit = 20): Promise<Event[]> {
    return this.getAll([
      Query.search("title", query),
      Query.limit(limit),
    ]);
  },

  // ── MUTATIONS ──

  async create(data: CreateEvent): Promise<Event> {
    const res = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.EVENTS,
      ID.unique(),
      data
    );
    return res as unknown as Event;
  },

  async update(eventId: string, data: UpdateEvent): Promise<Event> {
    const res = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.EVENTS,
      eventId,
      data
    );
    return res as unknown as Event;
  },

  async delete(eventId: string): Promise<void> {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_IDS.EVENTS,
      eventId
    );
  },

  // ── IMAGES ──

  async uploadImage(file: File): Promise<string> {
    const res = await storage.createFile(
      BUCKET_IDS.EVENT_IMAGES,
      ID.unique(),
      file
    );
    return storage
      .getFilePreview(BUCKET_IDS.EVENT_IMAGES, res.$id, 800, 450)
      .toString();
  },

  getImageUrl(fileId: string, width = 800, height = 450): string {
    return storage
      .getFilePreview(BUCKET_IDS.EVENT_IMAGES, fileId, width, height)
      .toString();
  },
};
