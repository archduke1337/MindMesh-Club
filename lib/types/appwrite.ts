// lib/types/appwrite.ts
// ═══════════════════════════════════════════════════════
// TypeScript type definitions for ALL Appwrite collections
// ═══════════════════════════════════════════════════════

// ── Base Appwrite document fields ──
export interface AppwriteDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $databaseId: string;
  $collectionId: string;
}

// ── Collection IDs ──
export const COLLECTION_IDS = {
  EVENTS: "events",
  REGISTRATIONS: "registrations",
  PROJECTS: "projects",
  GALLERY: "gallery",
  TEAM: "team",
  BLOG: "blog",
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

// ── Bucket IDs ──
export const BUCKET_IDS = {
  EVENT_IMAGES: "event-images",
  GALLERY_IMAGES: "gallery-images",
  BLOG_IMAGES: "blog-images",
  SPONSOR_LOGOS: "sponsor-logos",
  PROJECT_FILES: "project-files",
  SUBMISSION_FILES: "submission-files",
  DOCUMENTS: "documents",
} as const;

// ── Database ID ──
export const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";

// ═══════════════════════════════════════════
// 1. EVENTS
// ═══════════════════════════════════════════
export type EventType =
  | "hackathon"
  | "seminar"
  | "conference"
  | "workshop"
  | "meetup"
  | "webinar"
  | "competition"
  | "bootcamp";

export type EventStatus =
  | "draft"
  | "published"
  | "upcoming"
  | "ongoing"
  | "completed"
  | "cancelled";

export type RecurringPattern = "none" | "weekly" | "biweekly" | "monthly" | "quarterly";

export interface Organizer {
  name: string;
  avatar?: string;
  role?: string;
}

export interface Event extends AppwriteDocument {
  // Original fields
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
  status: EventStatus;
  isRecurring: boolean;
  recurringPattern: RecurringPattern;
  parentEventId: string | null;

  // New fields
  eventType: EventType;
  endDate: string | null;
  endTime: string | null;
  isOnline: boolean;
  streamUrl: string | null;
  organizers: string | null; // JSON string of Organizer[]
  registrationDeadline: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

// Helper to parse organizers JSON
export function parseOrganizers(json: string | null): Organizer[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════
// 2. EVENT TYPES
// ═══════════════════════════════════════════
export interface EventTypeDoc extends AppwriteDocument {
  name: string;
  label: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  features: string[];
  isActive: boolean;
  order: number;
}

// ═══════════════════════════════════════════
// 3. REGISTRATIONS
// ═══════════════════════════════════════════
export type RegistrationStatus = "confirmed" | "waitlisted" | "cancelled" | "checked_in";
export type RegistrationSource = "website" | "admin" | "import";

export interface Registration extends AppwriteDocument {
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  registeredAt: string;
  status: RegistrationStatus;
  ticketQRData: string | null;

  // New fields
  teamId: string | null;
  checkInTime: string | null;
  source: RegistrationSource;
}

// ═══════════════════════════════════════════
// 4. MEMBER PROFILES
// ═══════════════════════════════════════════
export type MemberYear =
  | "1st Year"
  | "2nd Year"
  | "3rd Year"
  | "4th Year"
  | "Alumni"
  | "Faculty";

export type MemberStatus = "pending" | "approved" | "suspended";

export interface MemberProfile extends AppwriteDocument {
  userId: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  branch: string;
  year: MemberYear;
  college: string;
  program: string;
  rollNumber: string | null;
  skills: string[];
  interests: string[];
  bio: string | null;
  avatar: string | null;
  linkedin: string | null;
  github: string | null;
  twitter: string | null;
  portfolio: string | null;
  memberStatus: MemberStatus;
  eventsAttended: number;
  badges: string[];
}

// ═══════════════════════════════════════════
// 5. ANNOUNCEMENTS
// ═══════════════════════════════════════════
export type AnnouncementType = "info" | "event" | "urgent" | "update";
export type AnnouncementPriority = "low" | "normal" | "high" | "critical";

export interface Announcement extends AppwriteDocument {
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  isPinned: boolean;
  isActive: boolean;
  eventId: string | null;
  link: string | null;
  linkText: string | null;
  createdBy: string;
  expiresAt: string | null;
}

// ═══════════════════════════════════════════
// 6. EVENT DOCUMENTS
// ═══════════════════════════════════════════
export type EventDocType =
  | "rulebook"
  | "code_of_conduct"
  | "guidelines"
  | "faq"
  | "materials"
  | "schedule";

export interface EventDocument extends AppwriteDocument {
  eventId: string;
  type: EventDocType;
  title: string;
  content: string | null;
  fileUrl: string | null;
  isRequired: boolean;
  isPublic: boolean;
  order: number;
}

// ═══════════════════════════════════════════
// 7. RESOURCES
// ═══════════════════════════════════════════
export type ResourceType =
  | "slides"
  | "video"
  | "notes"
  | "code"
  | "pdf"
  | "link"
  | "roadmap";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Resource extends AppwriteDocument {
  title: string;
  description: string | null;
  type: ResourceType;
  category: string;
  url: string | null;
  fileUrl: string | null;
  eventId: string | null;
  eventName: string | null;
  difficulty: Difficulty;
  tags: string[];
  uploadedBy: string;
  isApproved: boolean;
  isFeatured: boolean;
}

// ═══════════════════════════════════════════
// 8. FEEDBACK
// ═══════════════════════════════════════════
export interface Feedback extends AppwriteDocument {
  eventId: string;
  userId: string;
  userName: string | null;
  overallRating: number;
  contentRating: number | null;
  organizationRating: number | null;
  venueRating: number | null;
  highlights: string | null;
  improvements: string | null;
  wouldRecommend: boolean | null;
  testimonial: string | null;
  isPublic: boolean;
}

// ═══════════════════════════════════════════
// 9. HACKATHON TEAMS
// ═══════════════════════════════════════════
export type TeamStatus =
  | "forming"
  | "locked"
  | "submitted"
  | "disqualified"
  | "winner";

export interface HackathonTeam extends AppwriteDocument {
  eventId: string;
  teamName: string;
  description: string | null;
  leaderId: string;
  leaderName: string;
  leaderEmail: string;
  inviteCode: string;
  problemStatementId: string | null;
  problemStatement: string | null;
  memberCount: number;
  maxSize: number;
  status: TeamStatus;
  submissionId: string | null;
  teamLogo: string | null;
}

// ═══════════════════════════════════════════
// 10. TEAM MEMBERS (hackathon team members)
// ═══════════════════════════════════════════
export type TeamMemberRole = "leader" | "member";
export type TeamMemberStatus = "invited" | "accepted" | "declined" | "removed";

export interface TeamMember extends AppwriteDocument {
  teamId: string;
  eventId: string;
  userId: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  joinedAt: string;
}

// ═══════════════════════════════════════════
// 11. PROBLEM STATEMENTS
// ═══════════════════════════════════════════
export interface ProblemStatement extends AppwriteDocument {
  eventId: string;
  title: string;
  description: string;
  category: string | null;
  difficulty: Difficulty;
  expectedOutcome: string | null;
  resources: string[];
  sponsorName: string | null;
  maxTeams: number;
  enrolledTeams: number;
  isVisible: boolean;
  order: number;
}

// ═══════════════════════════════════════════
// 12. SUBMISSIONS
// ═══════════════════════════════════════════
export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected";

export interface Submission extends AppwriteDocument {
  eventId: string;
  teamId: string | null;
  userId: string;
  userName: string;
  projectTitle: string;
  projectDescription: string;
  problemStatementId: string | null;
  techStack: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  videoUrl: string | null;
  presentationUrl: string | null;
  screenshots: string[];
  teamPhotoUrl: string | null;
  additionalNotes: string | null;
  status: SubmissionStatus;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  totalScore: number;
}

// ═══════════════════════════════════════════
// 13. EVENT RESULTS
// ═══════════════════════════════════════════
export interface RankingEntry {
  position: number;
  teamId: string;
  teamName: string;
  score: number;
  prize?: string;
}

export interface CategoryWinner {
  category: string;
  teamId: string;
  teamName: string;
  prize?: string;
}

export interface EventResult extends AppwriteDocument {
  eventId: string;
  isPublished: boolean;
  publishedAt: string | null;
  publishedBy: string | null;
  totalTeams: number;
  totalParticipants: number;
  totalSubmissions: number;
  rankings: string | null; // JSON string of RankingEntry[]
  categoryWinners: string | null; // JSON string of CategoryWinner[]
  summary: string | null;
  highlightPhotos: string[];
}

// Helpers for JSON fields
export function parseRankings(json: string | null): RankingEntry[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

export function parseCategoryWinners(json: string | null): CategoryWinner[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

// ═══════════════════════════════════════════
// 14. PROJECTS
// ═══════════════════════════════════════════
export type OwnershipType = "individual" | "group" | "team";
export type ProgressStatus = "idea" | "in_progress" | "mvp" | "launched" | "ongoing";

export interface Project extends AppwriteDocument {
  // Original fields
  title: string;
  description: string;
  image: string;
  category: string;
  status: string | null;
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

  // New fields
  tagline: string | null;
  coverImage: string | null;
  screenshots: string[];
  submittedBy: string | null;
  submitterName: string | null;
  ownershipType: OwnershipType;
  problemSolved: string | null;
  approach: string | null;
  videoUrl: string | null;
  progressStatus: ProgressStatus;
  views: number;
  likes: number;
  eventId: string | null;
  eventName: string | null;
}

// ═══════════════════════════════════════════
// 15. GALLERY
// ═══════════════════════════════════════════
export type GalleryCategory =
  | "events"
  | "workshops"
  | "hackathons"
  | "team"
  | "projects"
  | "campus"
  | "achievements";

export interface GalleryImage extends AppwriteDocument {
  title: string;
  description: string | null;
  imageUrl: string;
  category: GalleryCategory;
  eventId: string | null;
  eventName: string | null;
  date: string | null;
  photographer: string | null;
  tags: string[];
  uploadedBy: string;
  isApproved: boolean;
  isFeatured: boolean;
  isHero: boolean;
  likes: number;
  views: number;
  attendees: number;
}

// ═══════════════════════════════════════════
// 16. CLUB MEMBERS (team collection)
// ═══════════════════════════════════════════
export type ClubMemberType = "core" | "volunteer" | "advisor" | "alumni" | "mentor";
export type ClubMemberColor =
  | "primary"
  | "secondary"
  | "warning"
  | "danger"
  | "success";

export interface ClubMember extends AppwriteDocument {
  // Original fields
  name: string;
  role: string;
  avatar: string | null;
  linkedin: string | null;
  github: string | null;
  bio: string | null;
  achievements: string[];
  color: string;
  position: number;
  isActive: boolean;

  // New fields
  memberType: ClubMemberType;
  designation: string | null;
  department: string | null;
  tagline: string | null;
  institution: string | null;
  course: string | null;
  year: string | null;
  twitter: string | null;
  contactEmail: string | null;
  skills: string[];
  isFeatured: boolean;
  displayOrder: number;
  joinedClubAt: string | null;
}

// ═══════════════════════════════════════════
// 17. SPONSORS
// ═══════════════════════════════════════════
export type SponsorTier = "platinum" | "gold" | "silver" | "bronze" | "partner";
export type SponsorType = "global" | "event";

export interface Sponsor extends AppwriteDocument {
  // Original fields
  name: string;
  logo: string;
  website: string;
  tier: SponsorTier;
  description: string | null;
  category: string | null;
  isActive: boolean;
  displayOrder: number;
  featured: boolean;
  startDate: string;
  endDate: string | null;

  // New fields
  logoDark: string | null;
  sponsorType: SponsorType;
  sponsoredEvents: string[];
  partnershipDescription: string | null;
  industry: string | null;
  benefits: string[];
  contactName: string | null;
  contactEmail: string | null;
  contactTitle: string | null;
  testimonialQuote: string | null;
  testimonialAuthor: string | null;
  contractStart: string | null;
  contractEnd: string | null;
}

// ═══════════════════════════════════════════
// 18. PROJECT UPDATES
// ═══════════════════════════════════════════
export interface ProjectUpdate extends AppwriteDocument {
  projectId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  images: string[];
  milestone: string | null;
}

// ═══════════════════════════════════════════
// 19. ROADMAPS
// ═══════════════════════════════════════════
export interface Roadmap extends AppwriteDocument {
  title: string;
  description: string | null;
  category: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  source: string | null;
  difficulty: Difficulty;
  tags: string[];
  isActive: boolean;
  order: number;
  addedBy: string;
}

// ═══════════════════════════════════════════
// 20. BLOG (unchanged schema)
// ═══════════════════════════════════════════
export interface BlogPost extends AppwriteDocument {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string | null;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  category: string;
  tags: string[];
  status: "draft" | "published";
  isFeatured: boolean;
  readTime: number;
  views: number;
  likes: number;
}

// ═══════════════════════════════════════════
// 21. JUDGES
// ═══════════════════════════════════════════
export type JudgeStatus = "invited" | "accepted" | "declined";

export interface Judge extends AppwriteDocument {
  eventId: string;
  userId: string | null;        // Appwrite user ID (if registered)
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  expertise: string[];          // ["AI/ML", "Web Dev", "Design"]
  organization: string | null;  // Company/University
  designation: string | null;   // "CTO", "Professor"
  linkedin: string | null;
  status: JudgeStatus;
  inviteCode: string;           // Unique code for judge to access scoring
  assignedTeams: string[];      // teamIds assigned for evaluation (empty = all)
  isLead: boolean;              // Lead judge can finalize scores
  order: number;                // Display order
}

// ═══════════════════════════════════════════
// 22. JUDGING CRITERIA
// ═══════════════════════════════════════════
export interface JudgingCriteria extends AppwriteDocument {
  eventId: string;
  name: string;                 // "Innovation", "Technical Complexity"
  description: string | null;   // Explain what to evaluate
  maxScore: number;             // e.g. 10
  weight: number;               // e.g. 0.3 (30%)
  order: number;                // Display order
}

// ═══════════════════════════════════════════
// 23. JUDGE SCORES
// ═══════════════════════════════════════════
export interface JudgeScore extends AppwriteDocument {
  eventId: string;
  judgeId: string;              // FK → judges.$id
  judgeName: string;
  submissionId: string;         // FK → submissions.$id
  teamId: string | null;        // FK → hackathon_teams.$id
  criteriaId: string;           // FK → judging_criteria.$id
  criteriaName: string;
  score: number;                // 0 to maxScore
  comment: string | null;       // Optional feedback per criterion
  scoredAt: string;             // ISO timestamp
}

// ═══════════════════════════════════════════
// 24. COUPONS
// ═══════════════════════════════════════════
export type CouponType = "percentage" | "fixed";
export type CouponScope = "global" | "event";

export interface Coupon extends AppwriteDocument {
  code: string;                 // e.g. "EARLYBIRD50"
  description: string | null;
  type: CouponType;             // "percentage" or "fixed"
  value: number;                // 50 (means 50% or ₹50 depending on type)
  minPurchase: number;          // Minimum event price to apply
  maxDiscount: number | null;   // Cap for percentage type (e.g. max ₹200 off)
  scope: CouponScope;           // "global" = all events, "event" = specific
  eventId: string | null;       // FK → events (if scope is "event")
  eventName: string | null;     // For display
  usageLimit: number;           // Max total uses (0 = unlimited)
  usedCount: number;            // Current usage count
  perUserLimit: number;         // Max uses per user (0 = unlimited)
  validFrom: string;            // ISO datetime
  validUntil: string;           // ISO datetime
  isActive: boolean;
  createdBy: string;            // Admin userId
}

// ═══════════════════════════════════════════
// 25. COUPON USAGE (tracking)
// ═══════════════════════════════════════════
export interface CouponUsage extends AppwriteDocument {
  couponId: string;             // FK → coupons.$id
  couponCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventId: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  usedAt: string;               // ISO timestamp
}

// ═══════════════════════════════════════════
// FORM INPUT TYPES (for creating/updating)
// ═══════════════════════════════════════════

export type CreateEvent = Omit<Event, keyof AppwriteDocument>;
export type UpdateEvent = Partial<CreateEvent>;

export type CreateRegistration = Omit<Registration, keyof AppwriteDocument>;
export type CreateMemberProfile = Omit<MemberProfile, keyof AppwriteDocument>;
export type UpdateMemberProfile = Partial<CreateMemberProfile>;

export type CreateAnnouncement = Omit<Announcement, keyof AppwriteDocument>;
export type UpdateAnnouncement = Partial<CreateAnnouncement>;

export type CreateHackathonTeam = Omit<HackathonTeam, keyof AppwriteDocument>;
export type CreateTeamMember = Omit<TeamMember, keyof AppwriteDocument>;

export type CreateSubmission = Omit<Submission, keyof AppwriteDocument>;
export type UpdateSubmission = Partial<CreateSubmission>;

export type CreateProject = Omit<Project, keyof AppwriteDocument>;
export type UpdateProject = Partial<CreateProject>;

export type CreateSponsor = Omit<Sponsor, keyof AppwriteDocument>;
export type UpdateSponsor = Partial<CreateSponsor>;

export type CreateClubMember = Omit<ClubMember, keyof AppwriteDocument>;
export type UpdateClubMember = Partial<CreateClubMember>;

export type CreateFeedback = Omit<Feedback, keyof AppwriteDocument>;
export type CreateRoadmap = Omit<Roadmap, keyof AppwriteDocument>;
export type UpdateRoadmap = Partial<CreateRoadmap>;

export type CreateJudge = Omit<Judge, keyof AppwriteDocument>;
export type UpdateJudge = Partial<CreateJudge>;

export type CreateJudgingCriteria = Omit<JudgingCriteria, keyof AppwriteDocument>;
export type CreateJudgeScore = Omit<JudgeScore, keyof AppwriteDocument>;

export type CreateCoupon = Omit<Coupon, keyof AppwriteDocument>;
export type UpdateCoupon = Partial<CreateCoupon>;

