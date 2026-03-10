// lib/events/types/talk.config.ts
import { EventTypeConfig, DETAIL_SECTIONS, ADMIN_TABS } from "../types";

export const talkConfig: EventTypeConfig = {
  type: "talk",
  label: "Talk / Lecture",
  description: "Speaker-driven session where experts present to an audience. Covers guest lectures, tech talks, alumni sessions, panel discussions, and debates.",
  icon: "Mic2",
  color: "from-emerald-500 to-green-600",

  capacityModel: "per-person",
  defaultCapacity: 200,

  registration: {
    model: "rsvp",
    requiresApproval: false,
    allowTeams: false,
    extraFields: [
      {
        name: "questions",
        label: "Questions for the Speaker",
        type: "textarea",
        required: false,
        placeholder: "Any questions you'd like the speaker to address?",
      },
    ],
  },

  ticket: {
    template: "minimal",
    fields: ["name", "venue", "time", "speakerInfo"],
    hasQRCode: false,
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
    rounds: false,
    submissions: false,
    judging: false,
    leaderboard: false,
    materials: false,
    speakers: true,
    schedule: true,
    certificates: false,
    streaming: true,
    qna: true,
    attendance: true,
    mentors: false,
    prizes: false,
    subEvents: false,
    problemStatements: false,
    voting: false,
    forum: false,
  },

  detailSections: [
    DETAIL_SECTIONS.OVERVIEW,
    DETAIL_SECTIONS.SPEAKERS,
    DETAIL_SECTIONS.SCHEDULE,
    DETAIL_SECTIONS.QNA,
    DETAIL_SECTIONS.REGISTRATION,
    DETAIL_SECTIONS.VENUE,
    DETAIL_SECTIONS.STREAMING,
    DETAIL_SECTIONS.CONTACT,
  ],

  adminTabs: [
    ADMIN_TABS.OVERVIEW,
    ADMIN_TABS.REGISTRATIONS,
    ADMIN_TABS.CHECK_IN,
    ADMIN_TABS.ATTENDANCE,
    ADMIN_TABS.SPEAKERS,
    ADMIN_TABS.STREAMING,
    ADMIN_TABS.FEEDBACK,
    ADMIN_TABS.ANALYTICS,
    ADMIN_TABS.EXPORT,
    ADMIN_TABS.SETTINGS,
  ],

  postEvent: {
    hasResults: false,
    hasCertificates: false,
    hasFeedback: true,
    hasGallery: true,
    hasRecording: true,
    hasResourceSharing: true,
  },

  extraEventFields: [
    {
      name: "talkSubtype",
      label: "Talk Type",
      type: "select",
      required: true,
      options: [
        { value: "guest-lecture", label: "Guest Lecture" },
        { value: "tech-talk", label: "Tech Talk" },
        { value: "alumni-session", label: "Alumni Session" },
        { value: "panel-discussion", label: "Panel Discussion" },
        { value: "debate", label: "Debate" },
        { value: "fireside-chat", label: "Fireside Chat" },
        { value: "ama", label: "AMA (Ask Me Anything)" },
        { value: "keynote", label: "Keynote" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "speakers",
      label: "Speaker(s)",
      type: "textarea",
      required: true,
      placeholder: "Speaker name, designation, organization",
      helpText: "Add each speaker on a new line",
    },
    {
      name: "speakerBio",
      label: "Speaker Bio",
      type: "textarea",
      required: false,
      placeholder: "Brief bio of the speaker(s)",
    },
    {
      name: "topics",
      label: "Topics to be Covered",
      type: "textarea",
      required: false,
      placeholder: "List of topics or agenda points",
    },
    {
      name: "isHybrid",
      label: "Hybrid Event (in-person + online stream)",
      type: "checkbox",
      required: false,
    },
    {
      name: "recordingAvailable",
      label: "Recording will be available post-event",
      type: "checkbox",
      required: false,
    },
  ],
};
