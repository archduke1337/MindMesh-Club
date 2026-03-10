// lib/events/types/drive.config.ts
import { EventTypeConfig, DETAIL_SECTIONS, ADMIN_TABS } from "../types";

export const driveConfig: EventTypeConfig = {
  type: "drive",
  label: "Recruitment / Volunteer Drive",
  description: "Club recruitment drives, volunteer signups, core-team inductions, and coordinator selections. Application-based with shortlisting, interview slots, and result announcements.",
  icon: "UserPlus",
  color: "from-emerald-500 to-teal-600",

  capacityModel: "strict",
  defaultCapacity: 50, // positions available

  registration: {
    model: "application",
    requiresApproval: true,
    allowTeams: false,
    extraFields: [
      {
        name: "applyingFor",
        label: "Applying For",
        type: "select",
        required: true,
        options: [], // Populated dynamically from event's positions config
        helpText: "Select the role or domain you're applying for",
      },
      {
        name: "yearOfStudy",
        label: "Year of Study",
        type: "select",
        required: true,
        options: [
          { value: "1", label: "1st Year" },
          { value: "2", label: "2nd Year" },
          { value: "3", label: "3rd Year" },
          { value: "4", label: "4th Year" },
        ],
      },
      {
        name: "branch",
        label: "Branch / Department",
        type: "text",
        required: true,
        placeholder: "e.g., CSE, ECE, IT",
      },
      {
        name: "whyJoin",
        label: "Why do you want to join?",
        type: "textarea",
        required: true,
        placeholder: "Tell us about your motivation and what you'd bring to the team (100-300 words)",
      },
      {
        name: "relevantExperience",
        label: "Relevant Experience / Skills",
        type: "textarea",
        required: true,
        placeholder: "List relevant skills, projects, or prior experience",
      },
      {
        name: "portfolioUrl",
        label: "Portfolio / GitHub / LinkedIn",
        type: "url",
        required: false,
        placeholder: "https://...",
      },
      {
        name: "resumeUrl",
        label: "Resume Link",
        type: "url",
        required: false,
        placeholder: "https://drive.google.com/...",
        helpText: "Upload your resume to Google Drive and share the link",
      },
      {
        name: "availability",
        label: "Weekly Availability (hours)",
        type: "select",
        required: true,
        options: [
          { value: "2-5", label: "2-5 hours/week" },
          { value: "5-10", label: "5-10 hours/week" },
          { value: "10-15", label: "10-15 hours/week" },
          { value: "15+", label: "15+ hours/week" },
        ],
      },
    ],
  },

  ticket: {
    template: "slot",
    fields: ["name", "role", "interviewSlot", "venue", "status"],
    hasQRCode: true,
    hasCheckIn: true,
    checkInModel: "individual",
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
    rounds: true,   // multiple selection rounds (application → task → interview)
    submissions: true, // assignment/task submissions between rounds
    judging: true,    // panel evaluation
    leaderboard: false,
    materials: false,
    speakers: false,
    schedule: true,   // interview schedule, timeline
    certificates: false,
    streaming: false,
    qna: false,
    attendance: true,  // interview attendance
    mentors: false,
    prizes: false,
    subEvents: false,
    problemStatements: false,
    voting: false,
    forum: false,
  },

  detailSections: [
    DETAIL_SECTIONS.OVERVIEW,
    DETAIL_SECTIONS.POSITIONS,
    DETAIL_SECTIONS.PROCESS,
    DETAIL_SECTIONS.SCHEDULE,
    DETAIL_SECTIONS.REGISTRATION,
    DETAIL_SECTIONS.FAQ,
    DETAIL_SECTIONS.CONTACT,
  ],

  adminTabs: [
    ADMIN_TABS.OVERVIEW,
    ADMIN_TABS.APPLICATIONS,
    ADMIN_TABS.SHORTLIST,
    ADMIN_TABS.ROUNDS,
    ADMIN_TABS.INTERVIEW_SLOTS,
    ADMIN_TABS.SUBMISSIONS,
    ADMIN_TABS.JUDGING,
    ADMIN_TABS.RESULTS,
    ADMIN_TABS.ANALYTICS,
    ADMIN_TABS.EXPORT,
    ADMIN_TABS.SETTINGS,
  ],

  postEvent: {
    hasResults: true,
    hasCertificates: false,
    hasFeedback: true,
    hasGallery: false,
    hasRecording: false,
    hasResourceSharing: false,
  },

  extraEventFields: [
    {
      name: "driveSubtype",
      label: "Drive Type",
      type: "select",
      required: true,
      options: [
        { value: "recruitment", label: "Club Recruitment" },
        { value: "core-team", label: "Core Team Induction" },
        { value: "coordinator", label: "Coordinator Selection" },
        { value: "volunteer", label: "Volunteer Drive" },
        { value: "ambassador", label: "Campus Ambassador" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "positions",
      label: "Open Positions (JSON)",
      type: "textarea",
      required: true,
      placeholder: '[\n  { "role": "Technical Lead", "domain": "web-dev", "slots": 2 },\n  { "role": "Design Lead", "domain": "design", "slots": 1 }\n]',
      helpText: "Define roles, domains, and number of openings",
    },
    {
      name: "selectionProcess",
      label: "Selection Process",
      type: "textarea",
      required: true,
      placeholder: "Round 1: Application Review\nRound 2: Technical Task\nRound 3: Interview",
      helpText: "Describe the selection pipeline step by step",
    },
    {
      name: "hasTask",
      label: "Includes Assignment/Task Round?",
      type: "checkbox",
      required: false,
      helpText: "Will shortlisted candidates be given a task to complete?",
    },
    {
      name: "taskDeadline",
      label: "Task Deadline",
      type: "date",
      required: false,
      helpText: "Deadline for task submission (if applicable)",
    },
    {
      name: "interviewMode",
      label: "Interview Mode",
      type: "select",
      required: false,
      options: [
        { value: "in-person", label: "In-Person" },
        { value: "online", label: "Online (Zoom/Meet)" },
        { value: "hybrid", label: "Hybrid" },
      ],
    },
    {
      name: "eligibilityCriteria",
      label: "Eligibility Criteria",
      type: "textarea",
      required: false,
      placeholder: "e.g., Only 1st and 2nd year students, Minimum CGPA 7.0",
    },
  ],
};
