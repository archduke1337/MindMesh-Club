// lib/services/feedback.service.ts
// ═══════════════════════════════════════════
// Feedback & Event Documents Service
// ═══════════════════════════════════════════

import { ID, Query } from "appwrite";
import { databases } from "../appwrite";
import {
  DATABASE_ID,
  COLLECTION_IDS,
  type Feedback,
  type CreateFeedback,
  type EventDocument,
  type EventDocType,
} from "../types/appwrite";

export const feedbackService = {
  // ── Feedback ──

  async getByEvent(eventId: string): Promise<Feedback[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.FEEDBACK,
      [Query.equal("eventId", eventId), Query.orderDesc("$createdAt")]
    );
    return res.documents as unknown as Feedback[];
  },

  async getPublicTestimonials(limit = 10): Promise<Feedback[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.FEEDBACK,
      [
        Query.equal("isPublic", true),
        Query.orderDesc("overallRating"),
        Query.limit(limit),
      ]
    );
    return res.documents as unknown as Feedback[];
  },

  async hasUserSubmitted(
    eventId: string,
    userId: string
  ): Promise<boolean> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.FEEDBACK,
      [
        Query.equal("eventId", eventId),
        Query.equal("userId", userId),
        Query.limit(1),
      ]
    );
    return res.documents.length > 0;
  },

  async create(data: CreateFeedback): Promise<Feedback> {
    return (await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.FEEDBACK,
      ID.unique(),
      data
    )) as unknown as Feedback;
  },

  async getAverageRating(
    eventId: string
  ): Promise<{ avg: number; count: number }> {
    const feedbacks = await this.getByEvent(eventId);
    if (feedbacks.length === 0) return { avg: 0, count: 0 };
    const sum = feedbacks.reduce((a, f) => a + f.overallRating, 0);
    return {
      avg: Math.round((sum / feedbacks.length) * 10) / 10,
      count: feedbacks.length,
    };
  },

  // ── Event Documents ──

  async getEventDocs(eventId: string): Promise<EventDocument[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.EVENT_DOCUMENTS,
      [Query.equal("eventId", eventId), Query.orderAsc("order")]
    );
    return res.documents as unknown as EventDocument[];
  },

  async getEventDocsByType(
    eventId: string,
    type: EventDocType
  ): Promise<EventDocument[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.EVENT_DOCUMENTS,
      [
        Query.equal("eventId", eventId),
        Query.equal("type", type),
        Query.orderAsc("order"),
      ]
    );
    return res.documents as unknown as EventDocument[];
  },

  async createEventDoc(
    data: Omit<EventDocument, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$databaseId" | "$collectionId">
  ): Promise<EventDocument> {
    return (await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.EVENT_DOCUMENTS,
      ID.unique(),
      data
    )) as unknown as EventDocument;
  },

  async updateEventDoc(
    id: string,
    data: Partial<EventDocument>
  ): Promise<EventDocument> {
    return (await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.EVENT_DOCUMENTS,
      id,
      data
    )) as unknown as EventDocument;
  },

  async deleteEventDoc(id: string): Promise<void> {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_IDS.EVENT_DOCUMENTS,
      id
    );
  },
};
