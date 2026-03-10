// lib/events/types/social.config.ts
import { EventTypeConfig, DETAIL_SECTIONS, ADMIN_TABS } from "../types";

export const socialConfig: EventTypeConfig = {
  type: "social",
  label: "Social / Fun Event",
  description: "Informal club hangouts, game nights, movie screenings, treasure hunts, field trips, freshers parties, farewells, and ice-breaker events. Minimal operations, maximum fun.",
  icon: "PartyPopper",
  color: "from-yellow-400 to-orange-500",

  capacityModel: "flexible",
  defaultCapacity: 100,

  registration: {
    model: "rsvp",
    requiresApproval: false,
    allowTeams: false,
    extraFields: [
      {
        name: "dietaryPreference",
        label: "Dietary Preference",
        type: "select",
        required: false,
        options: [
          { value: "veg", label: "Vegetarian" },
          { value: "non-veg", label: "Non-Vegetarian" },
          { value: "vegan", label: "Vegan" },
          { value: "no-preference", label: "No Preference" },
        ],
        helpText: "For events with food arrangements",
      },
      {
        name: "bringingGuest",
        label: "Bringing a Guest?",
        type: "checkbox",
        required: false,
        helpText: "Check if you plan to bring a plus-one (if allowed)",
      },
      {
        name: "tshirtSize",
        label: "T-Shirt Size",
        type: "select",
        required: false,
        options: [
          { value: "xs", label: "XS" },
          { value: "s", label: "S" },
          { value: "m", label: "M" },
          { value: "l", label: "L" },
          { value: "xl", label: "XL" },
          { value: "xxl", label: "XXL" },
        ],
        helpText: "For events with merchandise",
      },
    ],
  },

  ticket: {
    template: "minimal",
    fields: ["name", "venue", "date", "time"],
    hasQRCode: false,
    hasCheckIn: false,
    checkInModel: "none",
  },

  pricing: {
    model: "free-or-paid",
    defaultFree: true,
    supportsEarlyBird: false,
    supportsCoupons: true,
    supportsInstallments: false,
  },

  features: {
    teams: false,
    rounds: false,
    submissions: false,
    judging: false,
    leaderboard: false,
    materials: false,
    speakers: false,
    schedule: true,
    certificates: false,
    streaming: false,
    qna: false,
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
    DETAIL_SECTIONS.SCHEDULE,
    DETAIL_SECTIONS.REGISTRATION,
    DETAIL_SECTIONS.VENUE,
    DETAIL_SECTIONS.FAQ,
    DETAIL_SECTIONS.CONTACT,
  ],

  adminTabs: [
    ADMIN_TABS.OVERVIEW,
    ADMIN_TABS.REGISTRATIONS,
    ADMIN_TABS.ATTENDANCE,
    ADMIN_TABS.GALLERY,
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
    hasRecording: false,
    hasResourceSharing: false,
  },

  extraEventFields: [
    {
      name: "socialSubtype",
      label: "Event Subtype",
      type: "select",
      required: true,
      options: [
        { value: "meetup", label: "Meetup / Hangout" },
        { value: "game-night", label: "Game Night" },
        { value: "movie-screening", label: "Movie Screening" },
        { value: "treasure-hunt", label: "Treasure Hunt" },
        { value: "field-trip", label: "Field Trip / Outing" },
        { value: "freshers", label: "Freshers Party" },
        { value: "farewell", label: "Farewell" },
        { value: "ice-breaker", label: "Ice-Breaker Session" },
        { value: "code-night", label: "Code Night / LAN Party" },
        { value: "celebration", label: "Celebration / Anniversary" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "hasFood",
      label: "Food Arrangements",
      type: "checkbox",
      required: false,
      helpText: "Will food/refreshments be provided?",
    },
    {
      name: "hasMerch",
      label: "Merchandise",
      type: "checkbox",
      required: false,
      helpText: "Will merch (t-shirts, stickers) be distributed?",
    },
    {
      name: "dressCode",
      label: "Dress Code (if any)",
      type: "text",
      required: false,
      placeholder: "e.g., Casual, Formal, Theme-based",
    },
    {
      name: "allowPlusOne",
      label: "Allow Plus-One",
      type: "checkbox",
      required: false,
      helpText: "Can participants bring a guest who is not a club member?",
    },
  ],
};
