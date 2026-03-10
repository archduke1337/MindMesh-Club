// lib/events/types/fest.config.ts
import { EventTypeConfig, DETAIL_SECTIONS, ADMIN_TABS } from "../types";

export const festConfig: EventTypeConfig = {
  type: "fest",
  label: "Tech Fest / Multi-Day Fest",
  description: "Large-scale multi-day tech festival with multiple sub-events, a fest pass, individual event registrations, a fest-wide leaderboard, sponsors, and a grand schedule. Think college tech fest with 20+ parallel events.",
  icon: "CalendarRange",
  color: "from-indigo-600 to-purple-700",

  capacityModel: "unlimited",
  defaultCapacity: 1000,

  registration: {
    model: "fest-pass",
    requiresApproval: false,
    allowTeams: false,
    extraFields: [
      {
        name: "college",
        label: "College / University",
        type: "text",
        required: true,
        placeholder: "Your college name",
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
          { value: "5", label: "5th Year (Integrated)" },
          { value: "pg", label: "Post Graduate" },
          { value: "alumni", label: "Alumni" },
          { value: "faculty", label: "Faculty" },
        ],
      },
      {
        name: "branch",
        label: "Branch / Department",
        type: "text",
        required: false,
        placeholder: "e.g., CSE, ECE, IT...",
      },
      {
        name: "accommodationRequired",
        label: "Need Accommodation?",
        type: "checkbox",
        required: false,
        helpText: "For participants from other colleges",
      },
      {
        name: "interestedEvents",
        label: "Events of Interest",
        type: "multiselect",
        required: false,
        options: [], // Populated dynamically from sub-events
        helpText: "Select events you plan to participate in (you can register later too)",
      },
    ],
  },

  ticket: {
    template: "pass",
    fields: ["name", "festPassId", "college", "venue", "dates", "tier"],
    hasQRCode: true,
    hasCheckIn: true,
    checkInModel: "individual", // per sub-event
  },

  pricing: {
    model: "tiered",
    defaultFree: false,
    supportsEarlyBird: true,
    supportsCoupons: true,
    supportsInstallments: false,
  },

  features: {
    teams: true,       // some sub-events need teams
    rounds: true,      // sub-events may have rounds
    submissions: true,
    judging: true,
    leaderboard: true, // fest-wide leaderboard across events
    materials: false,
    speakers: true,    // keynote speakers, guests
    schedule: true,    // multi-day schedule is critical
    certificates: true,
    streaming: true,
    qna: false,
    attendance: true,
    mentors: true,
    prizes: true,
    subEvents: true,   // THIS IS THE DEFINING FEATURE
    problemStatements: true,
    voting: true,
    forum: false,
  },

  detailSections: [
    DETAIL_SECTIONS.OVERVIEW,
    DETAIL_SECTIONS.SUB_EVENTS,
    DETAIL_SECTIONS.SCHEDULE,
    DETAIL_SECTIONS.SPEAKERS,
    DETAIL_SECTIONS.SPONSORS,
    DETAIL_SECTIONS.LEADERBOARD,
    DETAIL_SECTIONS.PRIZES,
    DETAIL_SECTIONS.REGISTRATION,
    DETAIL_SECTIONS.VENUE,
    DETAIL_SECTIONS.FAQ,
    DETAIL_SECTIONS.CONTACT,
  ],

  adminTabs: [
    ADMIN_TABS.OVERVIEW,
    ADMIN_TABS.SUB_EVENTS,
    ADMIN_TABS.REGISTRATIONS,
    ADMIN_TABS.FEST_PASSES,
    ADMIN_TABS.CHECK_IN,
    ADMIN_TABS.SCHEDULE,
    ADMIN_TABS.LEADERBOARD,
    ADMIN_TABS.JUDGING,
    ADMIN_TABS.RESULTS,
    ADMIN_TABS.PRIZES,
    ADMIN_TABS.SPEAKERS,
    ADMIN_TABS.SPONSORS,
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
    hasRecording: true,
    hasResourceSharing: false,
  },

  extraEventFields: [
    {
      name: "festName",
      label: "Fest Name / Branding",
      type: "text",
      required: true,
      placeholder: "e.g., TechVista 2025, CodeFest 3.0",
    },
    {
      name: "festDays",
      label: "Number of Days",
      type: "number",
      required: true,
      placeholder: "2",
    },
    {
      name: "festTheme",
      label: "Fest Theme (optional)",
      type: "text",
      required: false,
      placeholder: "e.g., Innovation for Bharat, AI & Beyond",
    },
    {
      name: "hasAccommodation",
      label: "Provide Accommodation",
      type: "checkbox",
      required: false,
      helpText: "For outstation participants",
    },
    {
      name: "hasFestKit",
      label: "Fest Kit / Goodies",
      type: "checkbox",
      required: false,
      helpText: "Will a kit (t-shirt, ID, goodies) be given on registration?",
    },
    {
      name: "festPassTiers",
      label: "Pass Tiers (JSON)",
      type: "textarea",
      required: false,
      placeholder: '[\n  { "name": "Basic", "price": 0, "perks": ["Access to talks"] },\n  { "name": "Pro", "price": 499, "perks": ["All events + kit"] }\n]',
      helpText: "Define fest pass tiers with pricing and perks",
    },
    {
      name: "chiefGuest",
      label: "Chief Guest / Keynote Speaker",
      type: "text",
      required: false,
      placeholder: "Name and designation",
    },
    {
      name: "totalPrizePool",
      label: "Total Prize Pool",
      type: "text",
      required: false,
      placeholder: "e.g., ₹5,00,000",
    },
    {
      name: "festWebsiteUrl",
      label: "External Fest Website",
      type: "url",
      required: false,
      placeholder: "https://techvista.club",
      helpText: "If the fest has a separate website",
    },
  ],
};
