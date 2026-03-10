// lib/events/types/exhibition.config.ts
import { EventTypeConfig, DETAIL_SECTIONS, ADMIN_TABS } from "../types";

export const exhibitionConfig: EventTypeConfig = {
  type: "exhibition",
  label: "Exhibition / Expo",
  description: "Project showcase where exhibitors display work and visitors browse, vote, and judges evaluate. Covers project expos, poster presentations, science fairs, and demo days.",
  icon: "Presentation",
  color: "from-pink-500 to-rose-600",

  capacityModel: "dual",
  defaultCapacity: 30, // exhibitor slots

  registration: {
    model: "dual",
    requiresApproval: true, // exhibitors need approval
    allowTeams: true,       // exhibits can be team projects
    teamConfig: {
      minSize: 1,
      maxSize: 5,
      allowSolo: true,
      useInviteCode: false,
      autoAddLeader: true,
    },
    extraFields: [
      // Exhibitor fields
      {
        name: "projectTitle",
        label: "Project Title",
        type: "text",
        required: true,
        placeholder: "Name of your project",
        showWhen: { field: "registrationType", value: "exhibitor" },
      },
      {
        name: "projectAbstract",
        label: "Project Abstract",
        type: "textarea",
        required: true,
        placeholder: "Brief description of your project (200-500 words)",
        showWhen: { field: "registrationType", value: "exhibitor" },
      },
      {
        name: "category",
        label: "Project Category",
        type: "select",
        required: true,
        options: [
          { value: "software", label: "Software Project" },
          { value: "hardware", label: "Hardware / IoT" },
          { value: "ai-ml", label: "AI / ML" },
          { value: "web-app", label: "Web Application" },
          { value: "mobile-app", label: "Mobile App" },
          { value: "research", label: "Research Paper / Poster" },
          { value: "game", label: "Game" },
          { value: "other", label: "Other" },
        ],
        showWhen: { field: "registrationType", value: "exhibitor" },
      },
      {
        name: "requirements",
        label: "Setup Requirements",
        type: "multiselect",
        required: false,
        options: [
          { value: "table", label: "Table" },
          { value: "power-outlet", label: "Power Outlet" },
          { value: "monitor", label: "External Monitor" },
          { value: "wifi", label: "WiFi Access" },
          { value: "poster-stand", label: "Poster Stand" },
        ],
        showWhen: { field: "registrationType", value: "exhibitor" },
      },
      {
        name: "demoUrl",
        label: "Demo / Video URL",
        type: "url",
        required: false,
        placeholder: "https://youtube.com/...",
        showWhen: { field: "registrationType", value: "exhibitor" },
      },
      {
        name: "repoUrl",
        label: "Repository URL",
        type: "url",
        required: false,
        placeholder: "https://github.com/...",
        showWhen: { field: "registrationType", value: "exhibitor" },
      },
    ],
  },

  ticket: {
    template: "slot",
    fields: ["name", "role", "boothNumber", "projectTitle", "venue", "schedule"],
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
    mentors: false,
    prizes: true,
    subEvents: false,
    problemStatements: false,
    voting: true,
    forum: false,
  },

  detailSections: [
    DETAIL_SECTIONS.OVERVIEW,
    DETAIL_SECTIONS.EXHIBITORS,
    DETAIL_SECTIONS.SCHEDULE,
    DETAIL_SECTIONS.JUDGING,
    DETAIL_SECTIONS.PRIZES,
    DETAIL_SECTIONS.VOTING,
    DETAIL_SECTIONS.REGISTRATION,
    DETAIL_SECTIONS.VENUE,
    DETAIL_SECTIONS.FAQ,
    DETAIL_SECTIONS.CONTACT,
  ],

  adminTabs: [
    ADMIN_TABS.OVERVIEW,
    ADMIN_TABS.APPLICATIONS,    // exhibitor applications
    ADMIN_TABS.REGISTRATIONS,
    ADMIN_TABS.EXHIBITORS,
    ADMIN_TABS.CHECK_IN,
    ADMIN_TABS.JUDGING,
    ADMIN_TABS.VOTING,
    ADMIN_TABS.RESULTS,
    ADMIN_TABS.PRIZES,
    ADMIN_TABS.CERTIFICATES,
    ADMIN_TABS.GALLERY,
    ADMIN_TABS.FEEDBACK,
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
      name: "exhibitionSubtype",
      label: "Exhibition Type",
      type: "select",
      required: true,
      options: [
        { value: "project-expo", label: "Project Expo" },
        { value: "poster-presentation", label: "Poster Presentation" },
        { value: "science-fair", label: "Science Fair" },
        { value: "demo-day", label: "Demo Day" },
        { value: "startup-showcase", label: "Startup Showcase" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "maxExhibitors",
      label: "Max Exhibitor Slots",
      type: "number",
      required: true,
      placeholder: "30",
    },
    {
      name: "hasAudienceVoting",
      label: "Enable Audience Voting",
      type: "checkbox",
      required: false,
      helpText: "Allow visitors to vote for their favorite projects",
    },
    {
      name: "hasJudgingPanel",
      label: "Enable Judging Panel",
      type: "checkbox",
      required: false,
      helpText: "Expert judges will evaluate exhibits",
    },
    {
      name: "exhibitCategories",
      label: "Exhibit Categories",
      type: "textarea",
      required: false,
      placeholder: "One category per line (e.g., Best Hardware, Best AI Project)",
    },
  ],
};
