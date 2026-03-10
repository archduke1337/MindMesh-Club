// lib/events/types/competition.config.ts
import { EventTypeConfig, DETAIL_SECTIONS, ADMIN_TABS } from "../types";

export const competitionConfig: EventTypeConfig = {
  type: "competition",
  label: "Competition",
  description: "Perform-and-score event with rounds, brackets, and elimination. Covers coding contests, CTFs, quizzes, robo wars, gaming tournaments, debugging challenges, and more.",
  icon: "Trophy",
  color: "from-amber-500 to-orange-600",

  capacityModel: "per-person",
  defaultCapacity: 100,

  registration: {
    model: "individual",
    requiresApproval: false,
    allowTeams: true, // admin configures solo vs team mode
    teamConfig: {
      minSize: 1,
      maxSize: 4,
      allowSolo: true,
      useInviteCode: true,
      autoAddLeader: true,
    },
    extraFields: [
      {
        name: "participationMode",
        label: "Participation Mode",
        type: "select",
        required: false,
        options: [
          { value: "solo", label: "Solo" },
          { value: "team", label: "Team" },
        ],
        helpText: "Some competitions allow both solo and team participation",
      },
      {
        name: "skillLevel",
        label: "Skill Level",
        type: "select",
        required: false,
        options: [
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
        ],
      },
    ],
  },

  ticket: {
    template: "individual",
    fields: ["participantId", "name", "roundAssignment", "venue", "schedule"],
    hasQRCode: true,
    hasCheckIn: true,
    checkInModel: "individual",
  },

  pricing: {
    model: "per-person",
    defaultFree: false,
    supportsEarlyBird: true,
    supportsCoupons: true,
    supportsInstallments: false,
  },

  features: {
    teams: true,       // optional, admin-configurable
    rounds: true,
    submissions: true, // per-round answer submission
    judging: true,
    leaderboard: true,
    materials: false,
    speakers: false,
    schedule: true,
    certificates: true,
    streaming: false,
    qna: false,
    attendance: false,
    mentors: false,
    prizes: true,
    subEvents: false,
    problemStatements: true,
    voting: false,
    forum: false,
  },

  rounds: {
    supportsElimination: true,
    supportsBrackets: true,
    supportsTimedRounds: true,
  },

  detailSections: [
    DETAIL_SECTIONS.OVERVIEW,
    DETAIL_SECTIONS.ROUNDS,
    DETAIL_SECTIONS.PRIZES,
    DETAIL_SECTIONS.SCHEDULE,
    DETAIL_SECTIONS.LEADERBOARD,
    DETAIL_SECTIONS.REGISTRATION,
    DETAIL_SECTIONS.VENUE,
    DETAIL_SECTIONS.FAQ,
    DETAIL_SECTIONS.CONTACT,
  ],

  adminTabs: [
    ADMIN_TABS.OVERVIEW,
    ADMIN_TABS.REGISTRATIONS,
    ADMIN_TABS.TEAMS,
    ADMIN_TABS.ROUNDS,
    ADMIN_TABS.LEADERBOARD,
    ADMIN_TABS.JUDGING,
    ADMIN_TABS.RESULTS,
    ADMIN_TABS.CHECK_IN,
    ADMIN_TABS.PRIZES,
    ADMIN_TABS.CERTIFICATES,
    ADMIN_TABS.ANALYTICS,
    ADMIN_TABS.EXPORT,
    ADMIN_TABS.SETTINGS,
  ],

  postEvent: {
    hasResults: true,
    hasCertificates: true,
    hasFeedback: true,
    hasGallery: true,
    hasRecording: false,
    hasResourceSharing: false,
  },

  extraEventFields: [
    {
      name: "competitionSubtype",
      label: "Competition Subtype",
      type: "select",
      required: true,
      options: [
        { value: "coding-contest", label: "Coding Contest" },
        { value: "ctf", label: "Capture The Flag (CTF)" },
        { value: "quiz", label: "Technical Quiz" },
        { value: "debugging", label: "Debugging / Bug Hunt" },
        { value: "blind-coding", label: "Blind Coding" },
        { value: "robo-wars", label: "Robo Wars" },
        { value: "gaming", label: "Gaming Tournament" },
        { value: "design", label: "Design Challenge" },
        { value: "speed-coding", label: "Speed Coding" },
        { value: "code-golf", label: "Code Golf" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "participationMode",
      label: "Participation Mode",
      type: "select",
      required: true,
      options: [
        { value: "solo-only", label: "Solo Only" },
        { value: "team-only", label: "Team Only" },
        { value: "both", label: "Solo or Team" },
      ],
    },
    {
      name: "numberOfRounds",
      label: "Number of Rounds",
      type: "number",
      required: true,
      placeholder: "3",
    },
    {
      name: "eliminationType",
      label: "Elimination Type",
      type: "select",
      required: false,
      options: [
        { value: "none", label: "No Elimination (all compete in all rounds)" },
        { value: "top-n", label: "Top N advance each round" },
        { value: "bracket", label: "Bracket / Tournament Style" },
        { value: "score-cutoff", label: "Score Cutoff" },
      ],
    },
    {
      name: "timeLimitMinutes",
      label: "Time Limit per Round (minutes)",
      type: "number",
      required: false,
      placeholder: "60",
    },
    {
      name: "prizePool",
      label: "Total Prize Pool",
      type: "text",
      required: false,
      placeholder: "₹25,000",
    },
    {
      name: "platformUrl",
      label: "Competition Platform URL",
      type: "url",
      required: false,
      placeholder: "https://hackerrank.com/...",
      helpText: "External platform link (HackerRank, Kaggle, etc.) if applicable",
    },
  ],
};
