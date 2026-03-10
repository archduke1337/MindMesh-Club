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
  type Registration,
  type CreateEvent,
  type UpdateEvent,
  type EventType,
} from "../types/appwrite";
import { getErrorMessage } from "../errorHandler";

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

  // ══════════════════════════════════════════════════════════
  // Legacy aliases — backward compat with old database.ts API
  // New code should use the shorter names above.
  // ══════════════════════════════════════════════════════════

  /** @deprecated Use `getAll()` */
  async getAllEvents(queries: string[] = []): Promise<Event[]> {
    return this.getAll(queries);
  },

  /** @deprecated Use `getUpcoming()` */
  async getUpcomingEvents(): Promise<Event[]> {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.EVENTS,
      [Query.orderAsc("date"), Query.limit(100)]
    );
    return res.documents as unknown as Event[];
  },

  /** @deprecated Use `getById()` */
  async getEventById(eventId: string): Promise<Event> {
    return this.getById(eventId);
  },

  /** @deprecated Use `create()` */
  async createEvent(eventData: Omit<Event, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$databaseId" | "$collectionId">): Promise<Event> {
    const dataWithDefaults = { ...eventData, status: eventData.status || "upcoming" };
    const { isRecurring, recurringPattern, parentEventId, ...payload } = dataWithDefaults as any;
    const res = await databases.createDocument(DATABASE_ID, COLLECTION_IDS.EVENTS, ID.unique(), payload);
    return res as unknown as Event;
  },

  /** @deprecated Use `update()` */
  async updateEvent(eventId: string, eventData: Partial<Event>): Promise<Event> {
    const data = { ...eventData, ...(eventData.status !== undefined ? { status: eventData.status } : {}) };
    const { isRecurring, recurringPattern, parentEventId, ...payload } = data as any;
    const res = await databases.updateDocument(DATABASE_ID, COLLECTION_IDS.EVENTS, eventId, payload);
    return res as unknown as Event;
  },

  /** @deprecated Use `delete()` */
  async deleteEvent(eventId: string): Promise<boolean> {
    await this.delete(eventId);
    return true;
  },

  /** @deprecated Use `uploadImage()` */
  async uploadEventImage(file: File): Promise<string> {
    if (!file || file.size === 0) throw new Error("Invalid file: file is empty or missing");
    const res = await storage.createFile(BUCKET_IDS.EVENT_IMAGES, ID.unique(), file);
    const fileUrl = storage.getFileView(BUCKET_IDS.EVENT_IMAGES, res.$id);
    return String(fileUrl);
  },

  // ── REGISTRATION METHODS ──
  // All registration now goes through the server-side API to prevent race conditions
  // and to leverage the type-driven orchestrator.

  async registerForEvent(
    eventId: string,
    userId: string,
    userName: string,
    userEmail: string,
    options?: {
      mode?: "create" | "join" | "exhibitor" | "visitor";
      teamName?: string;
      inviteCode?: string;
      tier?: string;
      extraFields?: Record<string, unknown>;
    }
  ) {
    try {
      const response = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventId,
          ...options,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Registration failed");
      }

      // Return a Registration-like object for backward compatibility
      return {
        $id: data.data?.ticketId || data.ticketId || "",
        eventId,
        userId,
        userName,
        userEmail,
        registeredAt: new Date().toISOString(),
        status: data.data?.status || "confirmed",
        ticketQRData: null,
        teamId: data.data?.teamId || null,
        inviteCode: data.data?.inviteCode || null,
      } as unknown as Registration;
    } catch (error) {
      console.error("Error registering for event:", getErrorMessage(error));
      throw error;
    }
  },

  async unregisterFromEvent(eventId: string, userId: string) {
    try {
      const response = await fetch(
        `/api/events/register?eventId=${encodeURIComponent(eventId)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to cancel registration");
      }

      return true;
    } catch (error) {
      console.error("Error unregistering:", getErrorMessage(error));
      throw error;
    }
  },

  async getUserRegistrations(userId: string): Promise<Registration[]> {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_IDS.REGISTRATIONS, [
      Query.equal("userId", userId), Query.orderDesc("registeredAt"),
    ]);
    return res.documents as unknown as Registration[];
  },

  async getEventRegistrations(eventId: string): Promise<Registration[]> {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_IDS.REGISTRATIONS, [
        Query.equal("eventId", eventId), Query.orderDesc("registeredAt"),
      ]);
      return res.documents as unknown as Registration[];
    } catch { return []; }
  },

  async updateRegistration(registrationId: string, data: Partial<Registration>): Promise<Registration> {
    const res = await databases.updateDocument(DATABASE_ID, COLLECTION_IDS.REGISTRATIONS, registrationId, data);
    return res as unknown as Registration;
  },

  async updateRegistrationStatus(registrationId: string, status: string): Promise<Registration> {
    const updateData: Record<string, any> = { status };
    if (status === "checked_in") updateData.checkInTime = new Date().toISOString();
    return this.updateRegistration(registrationId, updateData as Partial<Registration>);
  },

  async isUserRegistered(eventId: string, userId: string): Promise<boolean> {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_IDS.REGISTRATIONS, [
        Query.equal("eventId", eventId), Query.equal("userId", userId), Query.limit(1),
      ]);
      return res.documents.length > 0;
    } catch { return false; }
  },

  buildTicketFromRegistration(registration: Registration, event: Event) {
    return {
      ticketId: registration.$id || "",
      eventId: registration.eventId,
      eventTitle: event.title,
      userName: registration.userName,
      userEmail: registration.userEmail,
      date: event.date,
      time: event.time,
      venue: event.venue,
      location: event.location,
      registeredAt: registration.registeredAt,
      price: event.price,
      discountPrice: event.discountPrice,
      image: event.image,
      ticketQRData: registration.ticketQRData,
    };
  },

  async getUserTickets(userId: string) {
    const registrations = await this.getUserRegistrations(userId);
    if (registrations.length === 0) return [];
    
    // Batch fetch all unique events to avoid N+1 queries
    const eventIds = [...new Set(registrations.map(r => r.eventId))];
    const eventPromises = eventIds.map(id => 
      this.getById(id).catch(error => {
        console.error(`Failed to fetch event ${id}:`, error);
        return null;
      })
    );
    
    const events = await Promise.all(eventPromises);
    const eventMap = new Map(
      events.filter((e): e is Event => e !== null).map(e => [e.$id, e])
    );
    
    // Build tickets with fetched event data
    return registrations.map(reg => {
      const event = eventMap.get(reg.eventId);
      if (event) {
        return this.buildTicketFromRegistration(reg, event);
      }
      // Fallback for missing events
      return {
        ticketId: reg.$id || "",
        eventId: reg.eventId,
        eventTitle: `Event ${reg.eventId}`,
        userName: reg.userName,
        userEmail: reg.userEmail,
        date: "",
        time: "",
        venue: "",
        location: "",
        registeredAt: reg.registeredAt,
        price: 0,
        discountPrice: null,
        image: "",
        ticketQRData: reg.ticketQRData,
      };
    });
  },

  async getTicketById(ticketId: string) {
    const reg = await databases.getDocument(DATABASE_ID, COLLECTION_IDS.REGISTRATIONS, ticketId) as unknown as Registration;
    const event = await this.getById(reg.eventId);
    return this.buildTicketFromRegistration(reg, event);
  },
};
