// lib/events/features/feature-resolver.ts
// ═══════════════════════════════════════════════════════
// Feature Resolver
// Determines which features are active for an event type
// and provides contextual labels/settings per type
// ═══════════════════════════════════════════════════════

import { EventType, EventFeatureFlags, DETAIL_SECTIONS, ADMIN_TABS } from "../types";
import { getEventTypeConfig, getEnabledFeatures } from "../registry";
import { FeatureSettings } from "./types";

/**
 * Contextual feature labels — same feature has different names per event type.
 * e.g., "submissions" in hackathon = "Project Submissions",
 *        "submissions" in drive = "Task Submissions",
 *        "submissions" in challenge = "Daily Submissions"
 */
const FEATURE_LABELS: Record<string, Partial<Record<EventType, string>>> = {
  teams: {
    hackathon: "Teams",
    competition: "Teams",
    exhibition: "Exhibitor Teams",
    fest: "Teams",
  },
  submissions: {
    hackathon: "Project Submissions",
    competition: "Submissions",
    bootcamp: "Assignments",
    drive: "Task Submissions",
    challenge: "Challenge Submissions",
    exhibition: "Project Details",
  },
  judging: {
    hackathon: "Judging Panel",
    competition: "Evaluation",
    exhibition: "Judging & Voting",
    drive: "Interview Panel",
  },
  speakers: {
    talk: "Speakers",
    webinar: "Presenter",
    workshop: "Instructor",
    bootcamp: "Instructors",
    fest: "Keynote Speakers",
  },
  materials: {
    workshop: "Workshop Materials",
    bootcamp: "Course Materials",
    webinar: "Session Resources",
    challenge: "Resources & Guides",
  },
  mentors: {
    hackathon: "Mentors",
    bootcamp: "Teaching Assistants",
    fest: "Mentors",
    challenge: "Doubt Support",
  },
  rounds: {
    competition: "Rounds & Brackets",
    drive: "Selection Rounds",
    fest: "Tournament Rounds",
  },
  leaderboard: {
    competition: "Leaderboard",
    challenge: "Leaderboard & Streaks",
    fest: "Fest Leaderboard",
  },
  certificates: {
    hackathon: "Participation Certificates",
    workshop: "Completion Certificate",
    bootcamp: "Course Certificate",
    webinar: "Attendance Certificate",
    competition: "Winner Certificates",
    exhibition: "Exhibitor Certificates",
    challenge: "Completion Certificate",
    fest: "Fest Certificates",
  },
  attendance: {
    workshop: "Attendance",
    bootcamp: "Daily Attendance",
    talk: "Attendance",
    webinar: "Join Tracking",
    social: "Head Count",
    drive: "Interview Attendance",
    fest: "Gate Entry Log",
  },
  schedule: {
    hackathon: "Hackathon Timeline",
    competition: "Round Schedule",
    workshop: "Session Agenda",
    bootcamp: "Daily Schedule",
    talk: "Event Schedule",
    fest: "Fest Schedule",
    social: "Event Timeline",
    webinar: "Session Agenda",
    drive: "Selection Timeline",
    challenge: "Challenge Timeline",
    exhibition: "Exhibition Schedule",
  },
};

/**
 * Default labels when no type-specific override exists
 */
const DEFAULT_LABELS: Record<keyof EventFeatureFlags, string> = {
  teams: "Teams",
  rounds: "Rounds",
  submissions: "Submissions",
  judging: "Judging",
  leaderboard: "Leaderboard",
  materials: "Materials",
  speakers: "Speakers",
  schedule: "Schedule",
  certificates: "Certificates",
  streaming: "Live Stream",
  qna: "Q&A",
  attendance: "Attendance",
  mentors: "Mentors",
  prizes: "Prizes",
  subEvents: "Sub-Events",
  problemStatements: "Problem Statements",
  voting: "Voting",
  forum: "Forum",
};

/**
 * Get contextual label for a feature within an event type.
 */
export function getFeatureLabel(
  feature: keyof EventFeatureFlags,
  eventType: EventType
): string {
  return FEATURE_LABELS[feature]?.[eventType] || DEFAULT_LABELS[feature] || feature;
}

/**
 * Get full feature settings for a specific feature in a specific event type.
 */
export function getFeatureSettings(
  feature: keyof EventFeatureFlags,
  eventType: EventType
): FeatureSettings {
  const config = getEventTypeConfig(eventType);
  const enabled = config.features[feature];

  return {
    enabled,
    label: getFeatureLabel(feature, eventType),
    adminTab: config.adminTabs.find((tab) =>
      tab.toLowerCase().includes(feature.toLowerCase())
    ),
    detailSection: config.detailSections.find((section) =>
      section.toLowerCase().includes(feature.toLowerCase())
    ),
    capabilities: getFeatureCapabilities(feature, eventType),
  };
}

/**
 * Get all active features for an event type with their settings.
 */
export function getActiveFeatures(
  eventType: EventType
): { feature: keyof EventFeatureFlags; settings: FeatureSettings }[] {
  const features = getEnabledFeatures(eventType);
  return features.map((feature) => ({
    feature,
    settings: getFeatureSettings(feature, eventType),
  }));
}

/**
 * Get capability descriptions for a feature in an event type context.
 */
function getFeatureCapabilities(
  feature: keyof EventFeatureFlags,
  eventType: EventType
): string[] {
  const capabilityMap: Partial<
    Record<keyof EventFeatureFlags, Partial<Record<EventType, string[]>>>
  > = {
    teams: {
      hackathon: ["create-team", "invite-members", "lock-team", "team-submissions"],
      competition: ["optional-teams", "team-or-solo"],
      exhibition: ["exhibitor-groups"],
    },
    submissions: {
      hackathon: ["file-upload", "link-submit", "team-submission", "deadline-enforce"],
      competition: ["code-submit", "timed-submit"],
      bootcamp: ["assignment-submit", "instructor-review"],
      challenge: ["daily-submit", "streak-track"],
      drive: ["task-submit", "deadline-enforce"],
    },
    judging: {
      hackathon: ["criteria-scoring", "weighted-scores", "judge-assignment"],
      competition: ["auto-score", "manual-score", "elimination"],
      exhibition: ["audience-voting", "panel-judging"],
      drive: ["shortlist", "interview-score"],
    },
    leaderboard: {
      competition: ["real-time", "round-based"],
      challenge: ["streak-based", "points-based", "daily-update"],
      fest: ["cross-event-points"],
    },
  };

  return capabilityMap[feature]?.[eventType] || ["view", "manage"];
}
