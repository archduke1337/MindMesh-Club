// lib/services/index.ts
// ═══════════════════════════════════════════
// Barrel export for all services
// ═══════════════════════════════════════════

export { eventService } from "./events.service";
export { memberService } from "./members.service";
export { hackathonService } from "./hackathon.service";
export { announcementService } from "./announcements.service";
export { resourceService } from "./resources.service";
export { feedbackService } from "./feedback.service";
export { clubService } from "./club.service";

// Re-export types for convenience
export type {
  Event,
  EventType,
  EventTypeDoc,
  Registration,
  MemberProfile,
  Announcement,
  EventDocument,
  Resource,
  Feedback,
  HackathonTeam,
  TeamMember,
  ProblemStatement,
  Submission,
  EventResult,
  Project,
  GalleryImage,
  ClubMember,
  Sponsor,
  ProjectUpdate,
  Roadmap,
  BlogPost,
  Organizer,
  Judge,
  JudgingCriteria,
  JudgeScore,
  Coupon,
  CouponUsage,
} from "../types/appwrite";

export {
  COLLECTION_IDS,
  BUCKET_IDS,
  DATABASE_ID,
  parseOrganizers,
  parseRankings,
  parseCategoryWinners,
} from "../types/appwrite";
