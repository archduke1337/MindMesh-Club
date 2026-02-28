// config/appwrite.ts
/**
 * Single source of truth for all Appwrite IDs and constants.
 * Replaces duplicated DATABASE_ID / COLLECTION_ID declarations scattered
 * across lib/appwrite.ts, lib/database.ts, and lib/types/appwrite.ts.
 */
import { env } from "./env";

// ── Core IDs ────────────────────────────────────────────

export const APPWRITE_ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
export const APPWRITE_PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
export const APPWRITE_API_KEY = env.APPWRITE_API_KEY ?? "";
export const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

// ── Collection IDs ──────────────────────────────────────

export const COLLECTIONS = {
  EVENTS: "events",
  REGISTRATIONS: "registrations",
  PROJECTS: "projects",
  GALLERY: "gallery",
  TEAM: "team",
  BLOG: env.NEXT_PUBLIC_APPWRITE_BLOGS_COLLECTION_ID || "blog",
  SPONSORS: "sponsors",
  EVENT_TYPES: "event_types",
  MEMBER_PROFILES: "member_profiles",
  ANNOUNCEMENTS: "announcements",
  EVENT_DOCUMENTS: "event_documents",
  RESOURCES: "resources",
  FEEDBACK: "feedback",
  HACKATHON_TEAMS: "hackathon_teams",
  TEAM_MEMBERS: "team_members",
  PROBLEM_STATEMENTS: "problem_statements",
  SUBMISSIONS: "submissions",
  EVENT_RESULTS: "event_results",
  PROJECT_UPDATES: "project_updates",
  ROADMAPS: "roadmaps",
  JUDGES: "judges",
  JUDGING_CRITERIA: "judging_criteria",
  JUDGE_SCORES: "judge_scores",
  COUPONS: "coupons",
  COUPON_USAGE: "coupon_usage",
} as const;

// ── Bucket IDs ──────────────────────────────────────────

export const BUCKETS = {
  EVENT_IMAGES: env.NEXT_PUBLIC_EVENT_IMAGES_BUCKET_ID || "event-images",
  GALLERY_IMAGES: env.NEXT_PUBLIC_GALLERY_IMAGES_BUCKET_ID || "gallery-images",
  BLOG_IMAGES: "blog-images",
  SPONSOR_LOGOS: "sponsor-logos",
  PROJECT_FILES: "project-files",
  SUBMISSION_FILES: "submission-files",
  DOCUMENTS: "documents",
} as const;
