// lib/database.ts
import { ID, Query } from "appwrite";
import { databases, storage } from "./appwrite";
import { getErrorMessage } from "./errorHandler";

// Database and Collection IDs
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
export const EVENTS_COLLECTION_ID = "events";
export const REGISTRATIONS_COLLECTION_ID = "registrations";
export const PROJECTS_COLLECTION_ID = "projects";
export const GALLERY_COLLECTION_ID = "gallery";
export const TEAM_COLLECTION_ID = "team";
export const BLOGS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_BLOGS_COLLECTION_ID || "blog";
export const EVENT_IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_EVENT_IMAGES_BUCKET_ID || "";
export const GALLERY_IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_GALLERY_IMAGES_BUCKET_ID || "";

// Event Interface - status is optional
export interface Event {
  $id?: string;
  title: string;
  description: string;
  image: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  category: string;
  price: number;
  discountPrice: number | null;
  capacity: number;
  registered: number;
  organizerName: string;
  organizerAvatar: string;
  tags: string[];
  isFeatured: boolean;
  isPremium: boolean;
  status?: string; // Made optional
  isRecurring?: boolean; // New: recurring events flag
  recurringPattern?: "none" | "weekly" | "biweekly" | "monthly" | "quarterly"; // New: recurrence pattern
  parentEventId?: string; // New: reference to parent if recurring
  $createdAt?: string;
  $updatedAt?: string;
}


// Registration Interface - status is optional
export interface Registration {
  $id?: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  registeredAt: string;
  status?: string; // Made optional
  ticketQRData?: string; // QR code data string (TICKET|id|name|title)
  checkInTime?: string; // Timestamp of check in
  $createdAt?: string;
  $updatedAt?: string;
}

// Project Interface
export interface Project {
  $id?: string;
  title: string;
  description: string;
  image: string;
  category: string;
  status?: string;
  progress: number;
  technologies: string[];
  stars: number;
  forks: number;
  contributors: number;
  duration: string;
  isFeatured: boolean;
  demoUrl: string;
  repoUrl: string;
  teamMembers: string[];
  createdAt: string;
  $createdAt?: string;
  $updatedAt?: string;
}

// Gallery Image Interface
export interface GalleryImage {
  $id?: string;
  title: string;
  description: string;
  imageUrl: string;
  category: "events" | "workshops" | "hackathons" | "team" | "projects" | "campus" | "achievements";
  date: string;
  attendees: number;
  uploadedBy: string;
  isApproved: boolean;
  isFeatured: boolean;
  tags: string[];
  eventId?: string;
  eventName?: string;
  photographer?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

// Team Member Interface
export interface TeamMember {
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

export const eventService = {
  // Get all events
  async getAllEvents(queries: string[] = []) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        queries
      );
      return response.documents as unknown as Event[];
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  },

  // Get upcoming events (filter by date instead of status)
  async getUpcomingEvents() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        [
          Query.orderAsc("date"),
          Query.limit(100)
        ]
      );
      
      console.log('📋 Loaded events from database:', response.documents.length);
      return response.documents as unknown as Event[];
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      throw error;
    }
  },

  // Get event by ID
  async getEventById(eventId: string) {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        eventId
      );
      return response as unknown as Event;
    } catch (error) {
      console.error("Error fetching event:", error);
      throw error;
    }
  },

  // Create event - Remove status if it doesn't exist in collection
  async createEvent(eventData: Omit<Event, '$id' | '$createdAt' | '$updatedAt'>) {
    try {
      // Ensure status has default value
      const dataWithDefaults = {
        ...eventData,
        status: eventData.status || "upcoming",
      };
      
      // Strip out attributes that might not be in the Appwrite schema yet
      const { isRecurring, recurringPattern, parentEventId, ...appwritePayload } = dataWithDefaults;
      
      const response = await databases.createDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        ID.unique(),
        appwritePayload
      );
      return response as unknown as Event;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  },

  // Update event
  async updateEvent(eventId: string, eventData: Partial<Event>) {
    try {
      // Only include status if explicitly provided to avoid overriding existing status
      const dataWithDefaults = {
        ...eventData,
        ...(eventData.status !== undefined ? { status: eventData.status } : {}),
      };
      
      // Strip out attributes that might not be in the Appwrite schema yet
      const { isRecurring, recurringPattern, parentEventId, ...appwritePayload } = dataWithDefaults;
      
      const response = await databases.updateDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        eventId,
        appwritePayload
      );
      return response as unknown as Event;
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  },

  // Delete event
  async deleteEvent(eventId: string) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        eventId
      );
      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  },

  // Delete past events
  async deletePastEvents() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await databases.listDocuments(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        [Query.lessThan("date", today)]
      );

      const deletePromises = response.documents.map(doc => 
        databases.deleteDocument(DATABASE_ID, EVENTS_COLLECTION_ID, doc.$id)
      );

      await Promise.all(deletePromises);
      return response.documents.length;
    } catch (error) {
      console.error("Error deleting past events:", error);
      throw error;
    }
  },

  // Upload event image with proper URL handling and validation
  async uploadEventImage(file: File) {
    try {
      if (!file || file.size === 0) {
        throw new Error("Invalid file: file is empty or missing");
      }

      const response = await storage.createFile(
        EVENT_IMAGES_BUCKET_ID,
        ID.unique(),
        file
      );

      console.log("Image uploaded successfully:", response.$id);

      // Get file view URL - returns string in Appwrite SDK v22+
      const fileUrl = storage.getFileView(EVENT_IMAGES_BUCKET_ID, response.$id);
      const urlString = String(fileUrl);
      
      if (!urlString || typeof urlString !== 'string') {
        throw new Error("Failed to generate image URL");
      }
      
      console.log("Image URL generated:", urlString);
      return urlString;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

  // Register for event with better error handling and race condition awareness
  async registerForEvent(eventId: string, userId: string, userName: string, userEmail: string) {
    try {
      // Check if already registered
      const existingRegistrations = await databases.listDocuments(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        [
          Query.equal("eventId", eventId),
          Query.equal("userId", userId),
          Query.limit(1)
        ]
      );

      if (existingRegistrations.documents.length > 0) {
        throw new Error("Already registered for this event");
      }

      // Get event to check capacity and status
      const event = await this.getEventById(eventId);
      
      if (event.capacity && event.registered >= event.capacity) {
        throw new Error("Event is full");
      }

      // Generate unique ticket ID
      const ticketId = ID.unique();

      // Generate QR code data for the ticket
      const ticketQRData = `TICKET|${ticketId}|${userName}|${event.title}`;

      // Create registration document with QR data
      const registration = await databases.createDocument(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        ticketId,
        {
          eventId,
          userId,
          userName,
          userEmail,
          registeredAt: new Date().toISOString(),
          ticketQRData,
        }
      );

      // Update event registered count (note: potential race condition with high concurrency)
      // Consider: use server-side endpoint for atomic updates or add optimistic retry logic
      try {
        await this.updateEvent(eventId, {
          registered: event.registered + 1
        });
      } catch (updateError) {
        console.warn("Warning: failed to update event registered count, but registration was created:", updateError);
        // Registration is still valid even if count update failed
      }

      return registration as unknown as Registration;
    } catch (error) {
      console.error("Error registering for event:", getErrorMessage(error));
      throw error;
    }
  },

  // Unregister user from event
  async unregisterFromEvent(eventId: string, userId: string) {
    try {
      // Find the registration to delete
      const registrations = await databases.listDocuments(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        [
          Query.equal("eventId", eventId),
          Query.equal("userId", userId),
          Query.limit(1)
        ]
      );

      if (registrations.documents.length === 0) {
        throw new Error("Registration not found");
      }

      const registrationId = registrations.documents[0].$id;

      // Delete the registration
      await databases.deleteDocument(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        registrationId
      );

      // Get event to decrement registered count
      const event = await this.getEventById(eventId);
      const newCount = Math.max(0, event.registered - 1);

      // Update event registered count
      await this.updateEvent(eventId, {
        registered: newCount
      });

      console.log(`User ${userId} unregistered from event ${eventId}`);
      return true;
    } catch (error) {
      console.error("Error unregistering from event:", getErrorMessage(error));
      throw error;
    }
  },

  // Get user registrations
  async getUserRegistrations(userId: string) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        [
          Query.equal("userId", userId),
          Query.orderDesc("registeredAt")
        ]
      );
      return response.documents as unknown as Registration[];
    } catch (error) {
      console.error("Error fetching user registrations:", error);
      throw error;
    }
  },

  // Get all registrations for an event (admin)
  async getEventRegistrations(eventId: string) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        [
          Query.equal("eventId", eventId),
          Query.orderDesc("registeredAt")
        ]
      );
      return response.documents as unknown as Registration[];
    } catch (error) {
      console.error("Error fetching event registrations:", error);
      return [];
    }
  },

  // Update registration (e.g., status, checkInTime)
  async updateRegistration(registrationId: string, data: Partial<Registration>) {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        registrationId,
        data
      );
      return response as unknown as Registration;
    } catch (error) {
      console.error("Error updating registration:", error);
      throw error;
    }
  },

  // Update registration status and check-in time
  async updateRegistrationStatus(registrationId: string, status: string) {
    const updateData: Partial<Registration> = { status };
    if (status === "checked_in") {
      updateData.checkInTime = new Date().toISOString();
    }
    return this.updateRegistration(registrationId, updateData);
  },

  // Check if user is registered for an event
  async isUserRegistered(eventId: string, userId: string): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        [
          Query.equal("eventId", eventId),
          Query.equal("userId", userId),
          Query.limit(1)
        ]
      );
      return response.documents.length > 0;
    } catch (error) {
      console.error("Error checking registration:", error);
      return false;
    }
  },

  // Helper: Build ticket object from registration and event (reusable, optimized)
  buildTicketFromRegistration(
    registration: Registration,
    event: Event
  ) {
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

  // Get user tickets with optimized batch loading and consistent shape
  async getUserTickets(userId: string) {
    try {
      const registrations = await this.getUserRegistrations(userId);
      
      if (registrations.length === 0) {
        return [];
      }

      // Batch fetch event details
      const ticketsWithDetails = await Promise.all(
        registrations.map(async (registration) => {
          try {
            const event = await this.getEventById(registration.eventId);
            return this.buildTicketFromRegistration(registration, event);
          } catch (error) {
            console.error(`Error fetching event details for ${registration.eventId}:`, error);
            // Return minimal ticket info as fallback
            return {
              ticketId: registration.$id || "",
              eventId: registration.eventId,
              eventTitle: `Event ${registration.eventId}`,
              userName: registration.userName,
              userEmail: registration.userEmail,
              date: "",
              time: "",
              venue: "",
              location: "",
              registeredAt: registration.registeredAt,
              price: 0,
              discountPrice: null,
              image: "",
              ticketQRData: registration.ticketQRData,
            };
          }
        })
      );

      return ticketsWithDetails;
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      throw error;
    }
  },

  // Get single ticket with details
  async getTicketById(ticketId: string) {
    try {
      const registration = await databases.getDocument(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        ticketId
      ) as unknown as Registration;

      const event = await this.getEventById(registration.eventId);
      return this.buildTicketFromRegistration(registration, event);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      throw error;
    }
  }
};

// Project Service
export const projectService = {
  // Get all projects
  async getAllProjects(queries: string[] = []) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        queries
      );
      return response.documents as unknown as Project[];
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  },

  // Get project by ID
  async getProjectById(projectId: string) {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        projectId
      );
      return response as unknown as Project;
    } catch (error) {
      console.error("Error fetching project:", error);
      throw error;
    }
  },

  // Get projects by category
  async getProjectsByCategory(category: string) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        [Query.equal("category", category)]
      );
      return response.documents as unknown as Project[];
    } catch (error) {
      console.error("Error fetching projects by category:", error);
      throw error;
    }
  },

  // Get featured projects
  async getFeaturedProjects() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        [Query.equal("isFeatured", true)]
      );
      return response.documents as unknown as Project[];
    } catch (error) {
      console.error("Error fetching featured projects:", error);
      throw error;
    }
  },

  // Create project (Admin only)
  async createProject(projectData: Omit<Project, '$id' | '$createdAt' | '$updatedAt'>) {
    try {
      // Ensure status has a default value
      const dataWithStatus = {
        ...projectData,
        status: projectData.status || "planning",
      };
      
      const response = await databases.createDocument(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        ID.unique(),
        dataWithStatus
      );
      return response as unknown as Project;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  },

  // Update project (Admin only)
  async updateProject(projectId: string, projectData: Partial<Project>) {
    try {
      // Only include status if explicitly provided to avoid overriding existing status
      const dataWithStatus = {
        ...projectData,
        ...(projectData.status !== undefined ? { status: projectData.status } : {}),
      };
      
      const response = await databases.updateDocument(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        projectId,
        dataWithStatus
      );
      return response as unknown as Project;
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  },

  // Delete project (Admin only)
  async deleteProject(projectId: string) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        projectId
      );
      return true;
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  },
};

// Gallery Service
export const galleryService = {
  // Get all gallery images
  async getAllImages(queries: string[] = []) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        GALLERY_COLLECTION_ID,
        queries
      );
      return response.documents as unknown as GalleryImage[];
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      throw error;
    }
  },

  // Get approved gallery images (public view)
  async getApprovedImages() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        GALLERY_COLLECTION_ID,
        [
          Query.equal("isApproved", true),
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ]
      );
      return response.documents as unknown as GalleryImage[];
    } catch (error) {
      console.error("Error fetching approved gallery images:", error);
      throw error;
    }
  },

  // Get featured gallery images
  async getFeaturedImages() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        GALLERY_COLLECTION_ID,
        [
          Query.equal("isApproved", true),
          Query.equal("isFeatured", true),
          Query.orderDesc("$createdAt"),
          Query.limit(20),
        ]
      );
      return response.documents as unknown as GalleryImage[];
    } catch (error) {
      console.error("Error fetching featured gallery images:", error);
      throw error;
    }
  },

  // Get images by category
  async getImagesByCategory(category: string) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        GALLERY_COLLECTION_ID,
        [
          Query.equal("isApproved", true),
          Query.equal("category", category),
          Query.orderDesc("$createdAt"),
          Query.limit(50),
        ]
      );
      return response.documents as unknown as GalleryImage[];
    } catch (error) {
      console.error("Error fetching images by category:", error);
      throw error;
    }
  },

  // Get image by ID
  async getImageById(imageId: string) {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        GALLERY_COLLECTION_ID,
        imageId
      );
      return response as unknown as GalleryImage;
    } catch (error) {
      console.error("Error fetching gallery image:", error);
      throw error;
    }
  },

  // Create gallery image (user/admin)
  async createImage(imageData: Omit<GalleryImage, '$id' | '$createdAt' | '$updatedAt'>) {
    try {
      // Ensure approval and featured have defaults
      const dataWithDefaults = {
        ...imageData,
        isApproved: imageData.isApproved !== undefined ? imageData.isApproved : false,
        isFeatured: imageData.isFeatured !== undefined ? imageData.isFeatured : false,
      };
      
      const response = await databases.createDocument(
        DATABASE_ID,
        GALLERY_COLLECTION_ID,
        ID.unique(),
        dataWithDefaults
      );
      return response as unknown as GalleryImage;
    } catch (error) {
      console.error("Error creating gallery image:", error);
      throw error;
    }
  },

  // Update gallery image (admin)
  async updateImage(imageId: string, imageData: Partial<GalleryImage>) {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        GALLERY_COLLECTION_ID,
        imageId,
        imageData
      );
      return response as unknown as GalleryImage;
    } catch (error) {
      console.error("Error updating gallery image:", error);
      throw error;
    }
  },

  // Approve gallery image (admin)
  async approveImage(imageId: string) {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        GALLERY_COLLECTION_ID,
        imageId,
        { isApproved: true }
      );
      return response as unknown as GalleryImage;
    } catch (error) {
      console.error("Error approving gallery image:", error);
      throw error;
    }
  },

  // Delete gallery image (admin)
  async deleteImage(imageId: string) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        GALLERY_COLLECTION_ID,
        imageId
      );
      return true;
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      throw error;
    }
  },

  // Toggle featured status
  async toggleFeatured(imageId: string, isFeatured: boolean) {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        GALLERY_COLLECTION_ID,
        imageId,
        { isFeatured }
      );
      return response as unknown as GalleryImage;
    } catch (error) {
      console.error("Error toggling featured status:", error);
      throw error;
    }
  },
};

// Team Service
export const teamService = {
  // Get all team members
  async getAllTeamMembers(queries: string[] = []) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        TEAM_COLLECTION_ID,
        [Query.orderAsc("position"), ...queries]
      );
      return response.documents as unknown as TeamMember[];
    } catch (error) {
      console.error("Error fetching team members:", error);
      throw error;
    }
  },

  // Get active team members
  async getActiveTeamMembers() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        TEAM_COLLECTION_ID,
        [Query.equal("isActive", true), Query.orderAsc("position")]
      );
      return response.documents as unknown as TeamMember[];
    } catch (error) {
      console.error("Error fetching active team members:", error);
      throw error;
    }
  },

  // Get team member by ID
  async getTeamMemberById(memberId: string) {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        TEAM_COLLECTION_ID,
        memberId
      );
      return response as unknown as TeamMember;
    } catch (error) {
      console.error("Error fetching team member:", error);
      throw error;
    }
  },

  // Create team member
  async createTeamMember(memberData: Omit<TeamMember, '$id' | '$createdAt' | '$updatedAt'>) {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        TEAM_COLLECTION_ID,
        ID.unique(),
        memberData
      );
      return response as unknown as TeamMember;
    } catch (error) {
      console.error("Error creating team member:", error);
      throw error;
    }
  },

  // Update team member
  async updateTeamMember(memberId: string, memberData: Partial<TeamMember>) {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        TEAM_COLLECTION_ID,
        memberId,
        memberData
      );
      return response as unknown as TeamMember;
    } catch (error) {
      console.error("Error updating team member:", error);
      throw error;
    }
  },

  // Delete team member
  async deleteTeamMember(memberId: string) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        TEAM_COLLECTION_ID,
        memberId
      );
      return true;
    } catch (error) {
      console.error("Error deleting team member:", error);
      throw error;
    }
  },

  // Upload team member avatar
  async uploadTeamMemberAvatar(file: File) {
    try {
      const response = await storage.createFile(
        EVENT_IMAGES_BUCKET_ID,
        ID.unique(),
        file
      );
      
      const fileUrl = storage.getFileView(EVENT_IMAGES_BUCKET_ID, response.$id);
      const urlString = fileUrl.toString();
      
      return urlString;
    } catch (error) {
      console.error("Error uploading team member avatar:", error);
      throw error;
    }
  },

  // Reorder team members
  async reorderTeamMembers(memberIds: string[]) {
    try {
      const updatePromises = memberIds.map((id, index) =>
        databases.updateDocument(
          DATABASE_ID,
          TEAM_COLLECTION_ID,
          id,
          { position: index }
        )
      );

      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error("Error reordering team members:", error);
      throw error;
    }
  },

  // Deactivate team member
  async deactivateTeamMember(memberId: string) {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        TEAM_COLLECTION_ID,
        memberId,
        { isActive: false }
      );
      return response as unknown as TeamMember;
    } catch (error) {
      console.error("Error deactivating team member:", error);
      throw error;
    }
  },

  // Activate team member
  async activateTeamMember(memberId: string) {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        TEAM_COLLECTION_ID,
        memberId,
        { isActive: true }
      );
      return response as unknown as TeamMember;
    } catch (error) {
      console.error("Error activating team member:", error);
      throw error;
    }
  },
};
