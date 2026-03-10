// lib/events/types/hackathon.config.ts
import { EventTypeConfig, DETAIL_SECTIONS, ADMIN_TABS } from "../types";

export const hackathonConfig: EventTypeConfig = {
  type: "hackathon",
  label: "Hackathon",
  description: "Team-based build-and-submit event over hours or days. Participants form teams, pick problem statements, build projects, and submit for judging.",
  icon: "Code2",
  color: "from-violet-600 to-purple-600",

  capacityModel: "per-team",
  defaultCapacity: 50, // 50 teams

  registration: {
    model: "team",
    requiresApproval: false,
    allowTeams: true,
    teamConfig: {
      minSize: 1,
      maxSize: 5,
      allowSolo: true,
      useInviteCode: true,
      autoAddLeader: true,
    },
    extraFields: [
      {
        name: "teamName",
        label: "Team Name",
        type: "text",
        required: true,
        placeholder: "Enter your team name",
      },
      {
        name: "problemStatementId",
        label: "Problem Statement",
        type: "select",
        required: false,
        helpText: "You can select this later",
        options: [], // populated dynamically from event's problem statements
      },
      {
        name: "techStack",
        label: "Planned Tech Stack",
        type: "multiselect",
        required: false,
        placeholder: "What technologies will you use?",
        options: [], // populated dynamically or free-form
      },
    ],
  },

  ticket: {
    template: "team",
    fields: ["teamName", "members", "problemStatement", "venue", "schedule", "wifiInfo"],
    hasQRCode: true,
    hasCheckIn: true,
    checkInModel: "team",
  },

  pricing: {
    model: "per-team",
    defaultFree: false,
    supportsEarlyBird: true,
    supportsCoupons: true,
    supportsInstallments: false,
  },

  features: {
    teams: true,
    rounds: false,
    submissions: true,
    judging: true,
    leaderboard: false,
    materials: false,
    speakers: false,
    schedule: true,
    certificates: true,
    streaming: false,
    qna: false,
    attendance: false,
    mentors: true,
    prizes: true,
    subEvents: false,
    problemStatements: true,
    voting: false,
    forum: false,
  },

  detailSections: [
    DETAIL_SECTIONS.OVERVIEW,
    DETAIL_SECTIONS.SCHEDULE,
    DETAIL_SECTIONS.PROBLEM_STATEMENTS,
    DETAIL_SECTIONS.PRIZES,
    DETAIL_SECTIONS.MENTORS,
    DETAIL_SECTIONS.TEAMS,
    DETAIL_SECTIONS.REGISTRATION,
    DETAIL_SECTIONS.VENUE,
    DETAIL_SECTIONS.SPONSORS,
    DETAIL_SECTIONS.FAQ,
    DETAIL_SECTIONS.CONTACT,
  ],

  adminTabs: [
    ADMIN_TABS.OVERVIEW,
    ADMIN_TABS.REGISTRATIONS,
    ADMIN_TABS.TEAMS,
    ADMIN_TABS.SUBMISSIONS,
    ADMIN_TABS.JUDGING,
    ADMIN_TABS.RESULTS,
    ADMIN_TABS.SCHEDULE,
    ADMIN_TABS.MENTORS,
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
      name: "maxTeamSize",
      label: "Max Team Size",
      type: "number",
      required: true,
      placeholder: "5",
      helpText: "Maximum members per team",
    },
    {
      name: "minTeamSize",
      label: "Min Team Size",
      type: "number",
      required: true,
      placeholder: "1",
      helpText: "Minimum members per team (1 = allow solo)",
    },
    {
      name: "submissionDeadline",
      label: "Submission Deadline",
      type: "date",
      required: true,
      helpText: "When project submissions close",
    },
    {
      name: "judgingStartDate",
      label: "Judging Start Date",
      type: "date",
      required: false,
      helpText: "When judging begins",
    },
    {
      name: "prizePool",
      label: "Total Prize Pool",
      type: "text",
      required: false,
      placeholder: "₹50,000",
    },
    {
      name: "themes",
      label: "Hackathon Themes/Tracks",
      type: "multiselect",
      required: false,
      helpText: "Themes or tracks participants can choose from",
      options: [],
    },
  ],
};
