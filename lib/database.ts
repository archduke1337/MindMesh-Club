// lib/database.ts
// ═══════════════════════════════════════════════════════════════
// @deprecated — This file is a backward-compatibility shim.
// New code should import from:
//   "@/lib/services"          — for service objects
//   "@/lib/types/appwrite"    — for types and constants
//
// All service logic has been moved to lib/services/*.service.ts.
// This file re-exports everything so existing consumers don't break.
// ═══════════════════════════════════════════════════════════════

// Re-export constants from the canonical source
export { DATABASE_ID, COLLECTION_IDS, BUCKET_IDS } from "./types/appwrite";

// Legacy collection ID constants (prefer COLLECTION_IDS.* in new code)
import { COLLECTION_IDS, BUCKET_IDS } from "./types/appwrite";
export const EVENTS_COLLECTION_ID = COLLECTION_IDS.EVENTS;
export const REGISTRATIONS_COLLECTION_ID = COLLECTION_IDS.REGISTRATIONS;
export const PROJECTS_COLLECTION_ID = COLLECTION_IDS.PROJECTS;
export const GALLERY_COLLECTION_ID = COLLECTION_IDS.GALLERY;
export const TEAM_COLLECTION_ID = COLLECTION_IDS.TEAM;
export const BLOGS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_BLOGS_COLLECTION_ID || "blog";
export const EVENT_IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_EVENT_IMAGES_BUCKET_ID || "";
export const GALLERY_IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_GALLERY_IMAGES_BUCKET_ID || "";

// Re-export interfaces (legacy shapes — prefer types from @/lib/types/appwrite)
export type { Event, Registration, Project, GalleryImage } from "./types/appwrite";
export type { LegacyTeamMember as TeamMember } from "./services/team.service";

// Re-export services from modularized files
export { eventService } from "./services/events.service";
export { projectService } from "./services/projects.service";
export { galleryService } from "./services/gallery.service";
export { teamService } from "./services/team.service";
