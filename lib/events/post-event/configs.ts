// lib/events/post-event/configs.ts
// ═══════════════════════════════════════════════════════
// Post-event configuration per event type.
// Maps each event type to its results, certificates,
// feedback, gallery, and resource-sharing settings.
// ═══════════════════════════════════════════════════════

import { EventType } from "../types";
import type {
  PostEventModule,
  ResultsConfig,
  CertificateConfig,
  FeedbackConfig,
  GalleryConfig,
  ResourceSharingConfig,
} from "./types";

// ── Defaults ────────────────────────────────────────

const DEFAULT_RESULTS: ResultsConfig = {
  rankingMode: "none",
  sourceFromJudging: false,
  hasCategoryWinners: false,
  resultLabel: "Results",
  teamResults: false,
};

const DEFAULT_CERTIFICATES: CertificateConfig = {
  availableTypes: ["participation"],
  requiresCompletion: false,
  titleTemplate: "Certificate of Participation",
};

const DEFAULT_FEEDBACK: FeedbackConfig = {
  questionSet: "default",
  allowAnonymous: true,
  autoSendEmail: false,
  emailDelayHours: 2,
};

const DEFAULT_GALLERY: GalleryConfig = {
  allowParticipantUploads: false,
  requireApproval: true,
  autoCategory: "events",
  maxUploadsPerUser: 5,
};

const DEFAULT_RESOURCE_SHARING: ResourceSharingConfig = {
  resourceTypes: [],
  uploadPermission: "admin",
  autoShare: false,
};

// ── Per-type configs ────────────────────────────────

const POST_EVENT_CONFIGS: Record<EventType, PostEventModule> = {
  hackathon: {
    eventType: "hackathon",
    results: {
      rankingMode: "score",
      sourceFromJudging: true,
      hasCategoryWinners: true,
      resultLabel: "Hackathon Results",
      teamResults: true,
    },
    certificates: {
      availableTypes: ["participation", "winner", "runner-up", "mentor", "organizer"],
      requiresCompletion: false,
      titleTemplate: "Certificate of Participation — {eventTitle} Hackathon",
    },
    feedback: {
      questionSet: "advanced",
      allowAnonymous: true,
      autoSendEmail: true,
      emailDelayHours: 4,
      extraQuestions: [
        {
          id: "team_experience",
          question: "How was the team collaboration experience?",
          type: "rating",
          required: true,
        },
        {
          id: "problem_statement",
          question: "Were the problem statements clear and well-scoped?",
          type: "rating",
          required: true,
        },
        {
          id: "mentorship",
          question: "How helpful was the mentorship?",
          type: "rating",
          required: false,
        },
      ],
    },
    gallery: {
      allowParticipantUploads: true,
      requireApproval: true,
      autoCategory: "hackathons",
      maxUploadsPerUser: 10,
    },
    resourceSharing: {
      resourceTypes: ["code", "slides"],
      uploadPermission: "admin",
      autoShare: false,
    },
  },

  competition: {
    eventType: "competition",
    results: {
      rankingMode: "score",
      sourceFromJudging: true,
      hasCategoryWinners: false,
      resultLabel: "Competition Results",
      teamResults: false,
    },
    certificates: {
      availableTypes: ["participation", "winner", "runner-up"],
      requiresCompletion: false,
      titleTemplate: "Certificate — {eventTitle}",
    },
    feedback: {
      questionSet: "quick",
      allowAnonymous: true,
      autoSendEmail: true,
      emailDelayHours: 1,
    },
    gallery: {
      allowParticipantUploads: false,
      requireApproval: true,
      autoCategory: "events",
      maxUploadsPerUser: 3,
    },
    resourceSharing: {
      resourceTypes: ["code", "solution"],
      uploadPermission: "admin",
      autoShare: true,
    },
  },

  workshop: {
    eventType: "workshop",
    results: DEFAULT_RESULTS,
    certificates: {
      availableTypes: ["completion"],
      requiresCompletion: true,
      minAttendancePercent: 80,
      titleTemplate: "Certificate of Completion — {eventTitle} Workshop",
    },
    feedback: {
      questionSet: "default",
      allowAnonymous: true,
      autoSendEmail: true,
      emailDelayHours: 1,
      extraQuestions: [
        {
          id: "hands_on",
          question: "Were the hands-on exercises useful?",
          type: "rating",
          required: true,
        },
      ],
    },
    gallery: {
      allowParticipantUploads: false,
      requireApproval: true,
      autoCategory: "workshops",
      maxUploadsPerUser: 3,
    },
    resourceSharing: {
      resourceTypes: ["slides", "code", "notes", "reference"],
      uploadPermission: "speakers",
      autoShare: true,
    },
  },

  talk: {
    eventType: "talk",
    results: DEFAULT_RESULTS,
    certificates: {
      availableTypes: ["participation", "speaker"],
      requiresCompletion: false,
      titleTemplate: "Certificate of Attendance — {eventTitle}",
    },
    feedback: {
      questionSet: "quick",
      allowAnonymous: true,
      autoSendEmail: true,
      emailDelayHours: 1,
    },
    gallery: {
      allowParticipantUploads: false,
      requireApproval: true,
      autoCategory: "events",
      maxUploadsPerUser: 3,
    },
    resourceSharing: {
      resourceTypes: ["slides", "recording", "reference"],
      uploadPermission: "speakers",
      autoShare: true,
    },
  },

  bootcamp: {
    eventType: "bootcamp",
    results: DEFAULT_RESULTS,
    certificates: {
      availableTypes: ["completion"],
      requiresCompletion: true,
      minAttendancePercent: 75,
      titleTemplate: "Certificate of Completion — {eventTitle} Bootcamp",
    },
    feedback: {
      questionSet: "advanced",
      allowAnonymous: true,
      autoSendEmail: true,
      emailDelayHours: 2,
      extraQuestions: [
        {
          id: "pacing",
          question: "Was the pacing of the bootcamp appropriate?",
          type: "rating",
          required: true,
        },
        {
          id: "assignments",
          question: "How useful were the assignments?",
          type: "rating",
          required: true,
        },
        {
          id: "improvement",
          question: "What topic would you like covered in more depth?",
          type: "text",
          required: false,
        },
      ],
    },
    gallery: {
      allowParticipantUploads: false,
      requireApproval: true,
      autoCategory: "workshops",
      maxUploadsPerUser: 5,
    },
    resourceSharing: {
      resourceTypes: ["slides", "code", "notes", "assignment", "solution", "reference"],
      uploadPermission: "admin",
      autoShare: true,
    },
  },

  exhibition: {
    eventType: "exhibition",
    results: {
      rankingMode: "category",
      sourceFromJudging: true,
      hasCategoryWinners: true,
      resultLabel: "Exhibition Awards",
      teamResults: false,
    },
    certificates: {
      availableTypes: ["participation", "winner", "exhibitor"],
      requiresCompletion: false,
      titleTemplate: "Certificate — {eventTitle} Exhibition",
    },
    feedback: {
      questionSet: "default",
      allowAnonymous: true,
      autoSendEmail: true,
      emailDelayHours: 2,
    },
    gallery: {
      allowParticipantUploads: true,
      requireApproval: true,
      autoCategory: "events",
      maxUploadsPerUser: 10,
    },
    resourceSharing: DEFAULT_RESOURCE_SHARING,
  },

  social: {
    eventType: "social",
    results: DEFAULT_RESULTS,
    certificates: DEFAULT_CERTIFICATES,
    feedback: {
      questionSet: "quick",
      allowAnonymous: true,
      autoSendEmail: false,
      emailDelayHours: 0,
    },
    gallery: {
      allowParticipantUploads: true,
      requireApproval: false,
      autoCategory: "events",
      maxUploadsPerUser: 10,
    },
    resourceSharing: DEFAULT_RESOURCE_SHARING,
  },

  fest: {
    eventType: "fest",
    results: {
      rankingMode: "tier",
      sourceFromJudging: false,
      hasCategoryWinners: true,
      resultLabel: "Fest Leaderboard & Awards",
      teamResults: false,
    },
    certificates: {
      availableTypes: ["participation", "winner", "volunteer", "organizer"],
      requiresCompletion: false,
      titleTemplate: "Certificate — {eventTitle}",
    },
    feedback: {
      questionSet: "advanced",
      allowAnonymous: true,
      autoSendEmail: true,
      emailDelayHours: 6,
    },
    gallery: {
      allowParticipantUploads: true,
      requireApproval: true,
      autoCategory: "events",
      maxUploadsPerUser: 15,
    },
    resourceSharing: DEFAULT_RESOURCE_SHARING,
  },

  webinar: {
    eventType: "webinar",
    results: DEFAULT_RESULTS,
    certificates: {
      availableTypes: ["participation"],
      requiresCompletion: false,
      titleTemplate: "Certificate of Attendance — {eventTitle}",
    },
    feedback: {
      questionSet: "quick",
      allowAnonymous: true,
      autoSendEmail: true,
      emailDelayHours: 1,
    },
    gallery: DEFAULT_GALLERY,
    resourceSharing: {
      resourceTypes: ["recording", "slides", "reference"],
      uploadPermission: "admin",
      autoShare: true,
    },
  },

  drive: {
    eventType: "drive",
    results: {
      rankingMode: "position",
      sourceFromJudging: false,
      hasCategoryWinners: false,
      resultLabel: "Selection Results",
      teamResults: false,
    },
    certificates: DEFAULT_CERTIFICATES,
    feedback: {
      questionSet: "default",
      allowAnonymous: true,
      autoSendEmail: true,
      emailDelayHours: 24,
    },
    gallery: DEFAULT_GALLERY,
    resourceSharing: DEFAULT_RESOURCE_SHARING,
  },

  challenge: {
    eventType: "challenge",
    results: {
      rankingMode: "score",
      sourceFromJudging: false,
      hasCategoryWinners: false,
      resultLabel: "Challenge Leaderboard",
      teamResults: false,
    },
    certificates: {
      availableTypes: ["completion", "winner", "runner-up"],
      requiresCompletion: true,
      titleTemplate: "Certificate — {eventTitle} Challenge",
    },
    feedback: {
      questionSet: "quick",
      allowAnonymous: true,
      autoSendEmail: true,
      emailDelayHours: 2,
    },
    gallery: DEFAULT_GALLERY,
    resourceSharing: {
      resourceTypes: ["code", "solution"],
      uploadPermission: "admin",
      autoShare: true,
    },
  },
};

// ── Accessors ───────────────────────────────────────

export function getPostEventConfig(eventType: EventType): PostEventModule {
  return POST_EVENT_CONFIGS[eventType];
}

export function getResultsConfig(eventType: EventType): ResultsConfig {
  return POST_EVENT_CONFIGS[eventType].results;
}

export function getCertificateConfig(eventType: EventType): CertificateConfig {
  return POST_EVENT_CONFIGS[eventType].certificates;
}

export function getFeedbackConfig(eventType: EventType): FeedbackConfig {
  return POST_EVENT_CONFIGS[eventType].feedback;
}

export function getGalleryConfig(eventType: EventType): GalleryConfig {
  return POST_EVENT_CONFIGS[eventType].gallery;
}

export function getResourceSharingConfig(
  eventType: EventType
): ResourceSharingConfig {
  return POST_EVENT_CONFIGS[eventType].resourceSharing;
}
