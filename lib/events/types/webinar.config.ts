// lib/events/types/webinar.config.ts
import { EventTypeConfig, DETAIL_SECTIONS, ADMIN_TABS } from "../types";

export const webinarConfig: EventTypeConfig = {
  type: "webinar",
  label: "Webinar / Online Session",
  description: "Online-only events streamed via Zoom, Google Meet, or YouTube Live. Auto-confirmed registration, calendar invites, live Q&A, recordings shared post-event.",
  icon: "Monitor",
  color: "from-sky-500 to-blue-600",

  capacityModel: "unlimited",
  defaultCapacity: 500,

  registration: {
    model: "individual",
    requiresApproval: false,
    allowTeams: false,
    extraFields: [
      {
        name: "timezone",
        label: "Your Timezone",
        type: "select",
        required: false,
        options: [
          { value: "IST", label: "IST (UTC+5:30)" },
          { value: "UTC", label: "UTC" },
          { value: "EST", label: "EST (UTC-5)" },
          { value: "PST", label: "PST (UTC-8)" },
        ],
        helpText: "So we can send you reminders in your timezone",
      },
      {
        name: "addToCalendar",
        label: "Add to Google Calendar",
        type: "checkbox",
        required: false,
        helpText: "Receive a calendar invite with the meeting link",
      },
    ],
  },

  ticket: {
    template: "virtual",
    fields: ["name", "meetingLink", "date", "time", "platform"],
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
    submissions: false,
    judging: false,
    leaderboard: false,
    materials: true,  // slides, resources shared post-session
    speakers: true,   // webinar presenters
    schedule: true,   // agenda / timeline
    certificates: true,
    streaming: true,  // core feature - live stream
    qna: true,        // live Q&A during webinar
    attendance: true,  // track who joined
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
    DETAIL_SECTIONS.REGISTRATION,
    DETAIL_SECTIONS.FAQ,
    DETAIL_SECTIONS.CONTACT,
  ],

  adminTabs: [
    ADMIN_TABS.OVERVIEW,
    ADMIN_TABS.REGISTRATIONS,
    ADMIN_TABS.SPEAKERS,
    ADMIN_TABS.ATTENDANCE,
    ADMIN_TABS.CERTIFICATES,
    ADMIN_TABS.FEEDBACK,
    ADMIN_TABS.ANALYTICS,
    ADMIN_TABS.EXPORT,
    ADMIN_TABS.SETTINGS,
  ],

  postEvent: {
    hasResults: false,
    hasCertificates: true,
    hasFeedback: true,
    hasGallery: false,
    hasRecording: true,   // recording is the key post-event deliverable
    hasResourceSharing: true,  // slides, notes, code shared post-session
  },

  extraEventFields: [
    {
      name: "webinarSubtype",
      label: "Webinar Type",
      type: "select",
      required: true,
      options: [
        { value: "tech-talk", label: "Tech Talk" },
        { value: "workshop-live", label: "Live Workshop" },
        { value: "ama", label: "Ask Me Anything" },
        { value: "panel", label: "Panel Discussion" },
        { value: "product-demo", label: "Product Demo" },
        { value: "career-session", label: "Career Session" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "platform",
      label: "Streaming Platform",
      type: "select",
      required: true,
      options: [
        { value: "zoom", label: "Zoom" },
        { value: "google-meet", label: "Google Meet" },
        { value: "youtube-live", label: "YouTube Live" },
        { value: "teams", label: "Microsoft Teams" },
        { value: "discord", label: "Discord Stage" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "meetingLink",
      label: "Meeting Link",
      type: "url",
      required: false,
      placeholder: "https://zoom.us/j/...",
      helpText: "Will be shared with registered participants before the event",
    },
    {
      name: "isRecorded",
      label: "Will be Recorded?",
      type: "checkbox",
      required: false,
      helpText: "Recording will be shared with participants post-event",
    },
    {
      name: "speakerName",
      label: "Speaker Name",
      type: "text",
      required: false,
      placeholder: "Name of the presenter",
    },
    {
      name: "speakerDesignation",
      label: "Speaker Designation",
      type: "text",
      required: false,
      placeholder: "e.g., SDE-3 at Google, Professor at IIT Delhi",
    },
    {
      name: "speakerLinkedin",
      label: "Speaker LinkedIn",
      type: "url",
      required: false,
      placeholder: "https://linkedin.com/in/...",
    },
  ],
};
