// lib/events/types/challenge.config.ts
import { EventTypeConfig, DETAIL_SECTIONS, ADMIN_TABS } from "../types";

export const challengeConfig: EventTypeConfig = {
  type: "challenge",
  label: "Challenge / Long-Running Contest",
  description: "Asynchronous, multi-day or multi-week challenges with rolling registration. Includes 30-day coding challenges, weekly problem series, open innovation challenges, and design sprints. Participants compete at their own pace.",
  icon: "Flame",
  color: "from-red-500 to-orange-600",

  capacityModel: "unlimited",
  defaultCapacity: 500,

  registration: {
    model: "rolling",
    requiresApproval: false,
    allowTeams: false,
    extraFields: [
      {
        name: "experienceLevel",
        label: "Experience Level",
        type: "select",
        required: true,
        options: [
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
        ],
        helpText: "Helps us suggest appropriate difficulty",
      },
      {
        name: "preferredLanguage",
        label: "Preferred Programming Language",
        type: "select",
        required: false,
        options: [
          { value: "python", label: "Python" },
          { value: "cpp", label: "C++" },
          { value: "java", label: "Java" },
          { value: "javascript", label: "JavaScript" },
          { value: "any", label: "Any / Multiple" },
        ],
        helpText: "For coding challenges",
      },
      {
        name: "githubUsername",
        label: "GitHub Username",
        type: "text",
        required: false,
        placeholder: "your-github-handle",
        helpText: "For tracking contributions and streaks",
      },
    ],
  },

  ticket: {
    template: "minimal",
    fields: ["name", "challengeName", "startDate", "endDate", "dashboardLink"],
    hasQRCode: false,
    hasCheckIn: false,
    checkInModel: "none",
  },

  pricing: {
    model: "free",
    defaultFree: true,
    supportsEarlyBird: false,
    supportsCoupons: false,
    supportsInstallments: false,
  },

  features: {
    teams: false,
    rounds: false,
    submissions: true,   // periodic submissions (daily/weekly)
    judging: false,       // usually auto-evaluated
    leaderboard: true,    // key feature — ongoing rankings
    materials: true,      // problem statements, resources
    speakers: false,
    schedule: true,       // challenge timeline
    certificates: true,   // completion certificates
    streaming: false,
    qna: false,
    attendance: false,
    mentors: true,        // doubt resolution, hints
    prizes: true,
    subEvents: false,
    problemStatements: true, // daily/weekly problems
    voting: false,
    forum: true,          // discussion forum for participants
  },

  detailSections: [
    DETAIL_SECTIONS.OVERVIEW,
    DETAIL_SECTIONS.LEADERBOARD,
    DETAIL_SECTIONS.PROBLEMS,
    DETAIL_SECTIONS.SCHEDULE,
    DETAIL_SECTIONS.PRIZES,
    DETAIL_SECTIONS.RULES,
    DETAIL_SECTIONS.REGISTRATION,
    DETAIL_SECTIONS.FAQ,
    DETAIL_SECTIONS.CONTACT,
  ],

  adminTabs: [
    ADMIN_TABS.OVERVIEW,
    ADMIN_TABS.REGISTRATIONS,
    ADMIN_TABS.PROBLEMS,
    ADMIN_TABS.SUBMISSIONS,
    ADMIN_TABS.LEADERBOARD,
    ADMIN_TABS.RESULTS,
    ADMIN_TABS.PRIZES,
    ADMIN_TABS.CERTIFICATES,
    ADMIN_TABS.FEEDBACK,
    ADMIN_TABS.ANALYTICS,
    ADMIN_TABS.EXPORT,
    ADMIN_TABS.SETTINGS,
  ],

  postEvent: {
    hasResults: true,
    hasCertificates: true,
    hasFeedback: true,
    hasGallery: false,
    hasRecording: false,
    hasResourceSharing: true, // solutions, editorials
  },

  extraEventFields: [
    {
      name: "challengeSubtype",
      label: "Challenge Type",
      type: "select",
      required: true,
      options: [
        { value: "30-day-coding", label: "30-Day Coding Challenge" },
        { value: "weekly-problems", label: "Weekly Problem Series" },
        { value: "open-innovation", label: "Open Innovation Challenge" },
        { value: "design-sprint", label: "Design Sprint" },
        { value: "bug-bounty", label: "Bug Bounty" },
        { value: "content-creation", label: "Content Creation Challenge" },
        { value: "contribution", label: "Open Source Contribution" },
        { value: "streak", label: "Streak Challenge (e.g., 100 Days of Code)" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "durationDays",
      label: "Challenge Duration (days)",
      type: "number",
      required: true,
      placeholder: "30",
    },
    {
      name: "submissionFrequency",
      label: "Submission Frequency",
      type: "select",
      required: true,
      options: [
        { value: "daily", label: "Daily" },
        { value: "weekly", label: "Weekly" },
        { value: "end-only", label: "End of Challenge Only" },
        { value: "anytime", label: "Anytime / Rolling" },
      ],
    },
    {
      name: "scoringModel",
      label: "Scoring Model",
      type: "select",
      required: true,
      options: [
        { value: "points-per-problem", label: "Points per Problem" },
        { value: "streak-based", label: "Streak / Consistency" },
        { value: "quality-judged", label: "Quality Judged" },
        { value: "auto-graded", label: "Auto-Graded" },
        { value: "peer-reviewed", label: "Peer Reviewed" },
      ],
    },
    {
      name: "platformUrl",
      label: "External Platform URL",
      type: "url",
      required: false,
      placeholder: "https://leetcode.com/contest/...",
      helpText: "Link to external platform if problems are hosted elsewhere",
    },
    {
      name: "hasStreakTracking",
      label: "Track Daily Streaks",
      type: "checkbox",
      required: false,
      helpText: "Track and display participant streaks",
    },
    {
      name: "allowLateJoin",
      label: "Allow Late Join",
      type: "checkbox",
      required: false,
      helpText: "Can participants join after the challenge has started?",
    },
    {
      name: "editorialsAfterEnd",
      label: "Publish Editorials After End",
      type: "checkbox",
      required: false,
      helpText: "Solutions and explanations shared after the challenge",
    },
  ],
};
